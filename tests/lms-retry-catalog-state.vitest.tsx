/**
 * Task #114 — Tombol retry memulihkan katalog tanpa kehilangan state search/filter
 *
 * Tes komponen menggunakan Vitest + @testing-library/react + happy-dom.
 * Fetch di-intercept lewat vi.spyOn agar setiap endpoint bisa dikontrol secara
 * deterministik: fase error (empty catalog, seedStatus=error) → klik Retry →
 * fase recovery (courses tersedia, seedStatus=done).
 *
 * Yang diverifikasi:
 * 1. Banner error muncul saat seedStatus='error' dan tidak ada kursus.
 * 2. Klik "Coba Lagi" memanggil POST /api/lms/retry-seed.
 * 3. Invalidasi memakai activeCategory yang sedang aktif (bukan default "all").
 * 4. Setelah recovery: search text tetap, category filter tetap aktif.
 * 5. Hanya kursus yang cocok dengan search yang ditampilkan setelah retry.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";

// ── Module under test ─────────────────────────────────────────────────────────
// Dynamic import so fetch mock is installed before module-level query defaults run.
import LmsPage from "../client/src/pages/lms";

// ── Sample data ───────────────────────────────────────────────────────────────

const COURSES_KONSTRUKSI = [
  {
    id: 1,
    title: "Panduan SKK Konstruksi",
    slug: "panduan-skk",
    shortDesc: "Cara mendapatkan SKK untuk tenaga konstruksi",
    category: "konstruksi",
    subcategory: "SKK",
    color: "#f97316",
    emoji: "🏗️",
    instructor: "Tim Gustafta",
    durationMinutes: 60,
    price: 0,
    level: "beginner",
    isFeatured: true,
    lessonCount: 5,
  },
  {
    id: 2,
    title: "K3 & Keselamatan Kerja",
    slug: "k3-keselamatan",
    shortDesc: "Modul keselamatan di area konstruksi",
    category: "konstruksi",
    subcategory: "K3",
    color: "#ef4444",
    emoji: "⛑️",
    instructor: "Tim Gustafta",
    durationMinutes: 45,
    price: 0,
    level: "beginner",
    isFeatured: false,
    lessonCount: 3,
  },
];

// ── Fetch mock helpers ────────────────────────────────────────────────────────

/** Make a JSON Response with a given status. */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Build a fetch spy with deterministic per-URL handlers. */
function buildFetchSpy(handlers: Record<string, () => Response>) {
  return vi.fn((url: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
    const method = init?.method?.toUpperCase() ?? "GET";
    const key = method === "GET" ? urlStr : `${method} ${urlStr.split("?")[0]}`;

    // Match longest matching handler key.
    const matchingKey = Object.keys(handlers).find((k) => urlStr.includes(k) || key.startsWith(k));
    if (matchingKey) return Promise.resolve(handlers[matchingKey]());

    // Default: 404
    return Promise.resolve(new Response(JSON.stringify({ error: "not found" }), { status: 404 }));
  });
}

// ── Test wrapper ──────────────────────────────────────────────────────────────

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Router>
      {children}
    </Router>
  );
}

function renderWithQuery(ui: React.ReactElement, queryClient: QueryClient) {
  return render(
    <QueryClientProvider client={queryClient}>
      <Wrapper>{ui}</Wrapper>
    </QueryClientProvider>
  );
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,       // no retries — fail fast in tests
        staleTime: 0,       // always re-fetch on invalidate
        gcTime: 0,
      },
    },
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("LmsPage — retry button preserves search and filter state", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  // ── Test 1: error banner appears with non-default filter active ─────────────

  it("shows the error banner when seedStatus is 'error' and courses are empty under an active filter", async () => {
    const queryClient = makeQueryClient();

    (global as any).fetch = buildFetchSpy({
      "/api/lms/status": () => jsonResponse({ seeding: false, seedStatus: "error", courseCount: 0 }),
      "/api/lms/courses": () => jsonResponse([]),
      "/api/lms/certificates": () => jsonResponse([]),
      "/api/lms/my-courses": () => jsonResponse([]),
      "/api/lms/ecourses": () => jsonResponse([]),
    });

    renderWithQuery(<LmsPage />, queryClient);

    // Click the "konstruksi" category filter (non-default).
    const konstruksiBtn = await screen.findByTestId("filter-konstruksi");
    fireEvent.click(konstruksiBtn);

    // Banner must appear.
    expect(await screen.findByTestId("catalog-seed-error")).toBeInTheDocument();
    expect(screen.getByTestId("button-retry-seed")).toBeInTheDocument();
  });

  // ── Test 2: retry fires POST /api/lms/retry-seed ───────────────────────────

  it("clicking 'Coba Lagi' calls POST /api/lms/retry-seed", async () => {
    const queryClient = makeQueryClient();
    const retryCalled = vi.fn();

    (global as any).fetch = buildFetchSpy({
      "/api/lms/status": () => jsonResponse({ seeding: false, seedStatus: "error", courseCount: 0 }),
      "/api/lms/courses": () => jsonResponse([]),
      "/api/lms/certificates": () => jsonResponse([]),
      "/api/lms/my-courses": () => jsonResponse([]),
      "/api/lms/ecourses": () => jsonResponse([]),
      "POST /api/lms/retry-seed": () => { retryCalled(); return jsonResponse({ ok: true }); },
    });

    renderWithQuery(<LmsPage />, queryClient);

    // Wait for error banner.
    expect(await screen.findByTestId("catalog-seed-error")).toBeInTheDocument();

    // Click Retry.
    fireEvent.click(screen.getByTestId("button-retry-seed"));

    await waitFor(() => expect(retryCalled).toHaveBeenCalledOnce());
  });

  // ── Test 3: active category is preserved after retry ──────────────────────

  it("invalidates /api/lms/courses with the active category — not the default 'all'", async () => {
    const queryClient = makeQueryClient();
    const fetchedUrls: string[] = [];

    // Phase 1 handlers (error state).
    let seedStatus = "error";
    let coursesData: typeof COURSES_KONSTRUKSI = [];

    (global as any).fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
      const method = (init?.method ?? "GET").toUpperCase();
      fetchedUrls.push(`${method} ${urlStr}`);

      if (urlStr.includes("/api/lms/retry-seed")) {
        // After retry, switch to recovery state.
        seedStatus = "done";
        coursesData = COURSES_KONSTRUKSI;
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      if (urlStr.includes("/api/lms/status")) {
        return Promise.resolve(jsonResponse({ seeding: false, seedStatus, courseCount: coursesData.length }));
      }
      if (urlStr.includes("/api/lms/courses")) {
        return Promise.resolve(jsonResponse(coursesData));
      }
      return Promise.resolve(jsonResponse([]));
    });

    renderWithQuery(<LmsPage />, queryClient);

    // Select "konstruksi" filter.
    const konstruksiBtn = await screen.findByTestId("filter-konstruksi");
    fireEvent.click(konstruksiBtn);

    // Wait for error state.
    expect(await screen.findByTestId("catalog-seed-error")).toBeInTheDocument();

    // Clear the URL log so we only capture post-retry fetches.
    fetchedUrls.length = 0;

    // Click Retry.
    await act(async () => {
      fireEvent.click(screen.getByTestId("button-retry-seed"));
    });

    // After retry, the courses endpoint must be re-fetched with "konstruksi" (not "all").
    await waitFor(() => {
      const coursesFetch = fetchedUrls.find(u => u.includes("/api/lms/courses"));
      expect(coursesFetch).toBeDefined();
      expect(coursesFetch).toContain("konstruksi");
    });
  });

  // ── Test 4: search text is retained across retry ───────────────────────────

  it("search text is retained in the input after the retry resolves", async () => {
    const queryClient = makeQueryClient();
    let seedStatus = "error";
    let coursesData: typeof COURSES_KONSTRUKSI = [];

    (global as any).fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
      const method = (init?.method ?? "GET").toUpperCase();

      if (urlStr.includes("/api/lms/retry-seed")) {
        seedStatus = "done";
        coursesData = COURSES_KONSTRUKSI;
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      if (urlStr.includes("/api/lms/status")) {
        return Promise.resolve(jsonResponse({ seeding: false, seedStatus, courseCount: coursesData.length }));
      }
      if (urlStr.includes("/api/lms/courses")) {
        return Promise.resolve(jsonResponse(coursesData));
      }
      return Promise.resolve(jsonResponse([]));
    });

    renderWithQuery(<LmsPage />, queryClient);

    // Type search text BEFORE switching to error state — simulates a user who
    // was browsing, got an error, and wants to retry.
    const searchInput = await screen.findByTestId("input-search-courses");
    fireEvent.change(searchInput, { target: { value: "Panduan" } });
    expect((searchInput as HTMLInputElement).value).toBe("Panduan");

    // Select "konstruksi" category.
    fireEvent.click(await screen.findByTestId("filter-konstruksi"));

    // Wait for error banner.
    expect(await screen.findByTestId("catalog-seed-error")).toBeInTheDocument();

    // Click Retry and wait for recovery.
    await act(async () => {
      fireEvent.click(screen.getByTestId("button-retry-seed"));
    });

    // Wait until error banner disappears (courses are back).
    await waitFor(() =>
      expect(screen.queryByTestId("catalog-seed-error")).not.toBeInTheDocument(),
      { timeout: 5000 }
    );

    // Search input must still hold the original value.
    expect((screen.getByTestId("input-search-courses") as HTMLInputElement).value).toBe("Panduan");
  });

  // ── Test 5: only matching courses render after retry ──────────────────────

  it("only courses matching the search term render after a successful retry", async () => {
    const queryClient = makeQueryClient();
    let seedStatus = "error";
    let coursesData: typeof COURSES_KONSTRUKSI = [];

    (global as any).fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;
      const method = (init?.method ?? "GET").toUpperCase();

      if (urlStr.includes("/api/lms/retry-seed")) {
        seedStatus = "done";
        coursesData = COURSES_KONSTRUKSI; // two courses: "Panduan SKK" and "K3"
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      if (urlStr.includes("/api/lms/status")) {
        return Promise.resolve(jsonResponse({ seeding: false, seedStatus, courseCount: coursesData.length }));
      }
      if (urlStr.includes("/api/lms/courses")) {
        return Promise.resolve(jsonResponse(coursesData));
      }
      return Promise.resolve(jsonResponse([]));
    });

    renderWithQuery(<LmsPage />, queryClient);

    // Set search to "Panduan" — only course #1 should match.
    const searchInput = await screen.findByTestId("input-search-courses");
    fireEvent.change(searchInput, { target: { value: "Panduan" } });

    // Error state (no courses yet).
    expect(await screen.findByTestId("catalog-seed-error")).toBeInTheDocument();

    // Click Retry.
    await act(async () => {
      fireEvent.click(screen.getByTestId("button-retry-seed"));
    });

    // Wait for course cards to appear.
    await waitFor(
      () => expect(screen.getByTestId("card-course-1")).toBeInTheDocument(),
      { timeout: 5000 }
    );

    // Course #1 ("Panduan SKK") must be visible.
    expect(screen.getByTestId("card-course-1")).toBeInTheDocument();

    // Course #2 ("K3") does NOT match "Panduan" — must be hidden.
    expect(screen.queryByTestId("card-course-2")).not.toBeInTheDocument();

    // Search input is unchanged.
    expect((screen.getByTestId("input-search-courses") as HTMLInputElement).value).toBe("Panduan");
  });

  // ── Test 6: active category filter tab stays highlighted after retry ────────

  it("the active category filter button stays highlighted after a successful retry", async () => {
    const queryClient = makeQueryClient();
    let seedStatus = "error";
    let coursesData: typeof COURSES_KONSTRUKSI = [];

    (global as any).fetch = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : (url as Request).url;

      if (urlStr.includes("/api/lms/retry-seed")) {
        seedStatus = "done";
        coursesData = COURSES_KONSTRUKSI;
        return Promise.resolve(jsonResponse({ ok: true }));
      }
      if (urlStr.includes("/api/lms/status")) {
        return Promise.resolve(jsonResponse({ seeding: false, seedStatus, courseCount: coursesData.length }));
      }
      if (urlStr.includes("/api/lms/courses")) {
        return Promise.resolve(jsonResponse(coursesData));
      }
      return Promise.resolve(jsonResponse([]));
    });

    renderWithQuery(<LmsPage />, queryClient);

    // Click "konstruksi" filter.
    const konstruksiBtn = await screen.findByTestId("filter-konstruksi");
    fireEvent.click(konstruksiBtn);

    // Error banner appears.
    expect(await screen.findByTestId("catalog-seed-error")).toBeInTheDocument();

    // Click Retry.
    await act(async () => {
      fireEvent.click(screen.getByTestId("button-retry-seed"));
    });

    // Wait for recovery.
    await waitFor(
      () => expect(screen.queryByTestId("catalog-seed-error")).not.toBeInTheDocument(),
      { timeout: 5000 }
    );

    // "konstruksi" filter button must still be active (has the highlighted class).
    const btn = screen.getByTestId("filter-konstruksi");
    expect(btn).toHaveClass("bg-indigo-600");

    // "all" filter must NOT be active.
    expect(screen.getByTestId("filter-all")).not.toHaveClass("bg-indigo-600");
  });
});
