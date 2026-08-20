import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const { apiRequest, authState } = vi.hoisted(() => ({ apiRequest: vi.fn(), authState: { superAdmin: true } }));
const payload = {
  stages: ["L0", "L1", "L2", "L3", "L4", "L5"],
  relationTypes: ["NEXT_STEP"],
  ladderStatuses: ["DRAFT", "ACTIVE", "ARCHIVED"],
  ladders: [{
    id: 1, name: "Founder path", status: "DRAFT", nodes: [{
      id: 9, ladderId: 1, stage: "L1", nodeType: "PRODUCT", productRegistryId: "prod-alpha",
      sortOrder: 0, isActive: true, product: { name: "Alpha", productId: "prod-alpha", price: 125000, currency: "IDR", status: "ACTIVE" },
    }, {
      id: 10, ladderId: 1, stage: "L2", nodeType: "PLACEHOLDER", label: "Outcome",
      sortOrder: 2, isActive: true,
    }], edges: [{
      id: 11, ladderId: 1, fromNodeId: 9, toNodeId: 10, relationType: "NEXT_STEP",
      ruleText: "Continue", sortOrder: 3, isActive: true,
    }], warnings: ["Preview warning"],
  }],
  inventory: [{ id: 4, productId: "prod-alpha", name: "Alpha", productType: "TOOL", category: "Core", status: "ACTIVE", price: 125000, currency: "IDR", coverageStatus: "MAPPED", ladderRefs: [{ id: 1, name: "Founder path", slug: "founder-path", stage: "L1" }] }],
  packages: [{ packageId: "pkg-starter", name: "Starter", price: 250000, currency: "IDR", status: "ACTIVE" }],
  summary: { totalActiveProducts: 1, mappedProducts: 1, independentProducts: 0, undecidedProducts: 0 },
};

vi.mock("@/lib/queryClient", () => ({ apiRequest }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: vi.fn() }) }));
vi.mock("wouter", () => ({ Link: ({ children, ...props }: any) => <a {...props}>{children}</a> }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey, enabled = true }: any) => {
    if (!enabled) return { data: undefined, isLoading: false, isError: false };
    return queryKey[0] === "/api/admin/me"
      ? { data: { isSuperAdmin: authState.superAdmin }, isLoading: false, isError: false }
      : { data: payload, isLoading: false, isError: false, refetch: vi.fn() };
  },
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  useMutation: (options: any) => ({
    isPending: false,
    mutate: (value: any) => {
      Promise.resolve(options.mutationFn(value)).then(options.onSuccess, options.onError);
    },
  }),
}));

import AdminSalesLadder from "../client/src/pages/admin-sales-ladder";

describe("AdminSalesLadder contract", () => {
  beforeEach(() => {
    apiRequest.mockReset();
    apiRequest.mockResolvedValue({});
    authState.superAdmin = true;
  });

  it("denies non-superadmin direct access", () => {
    authState.superAdmin = false;
    render(<AdminSalesLadder />);
    expect(screen.getByText("Sales Ladder desk hanya tersedia untuk Super Admin.")).toBeInTheDocument();
  });

  it("renders active inventory coverage and never offers manual mapped mutation", () => {
    render(<AdminSalesLadder />);
    expect(screen.getByTestId("row-inventory-prod-alpha")).toBeInTheDocument();
    expect(screen.getByText("Mapped otomatis. Hapus semua node ladder untuk menjadikannya editable.")).toBeInTheDocument();
    expect(screen.queryByTestId("button-coverage-independent-prod-alpha")).not.toBeInTheDocument();
  });

  it("uses canonical string product and package selectors", () => {
    render(<AdminSalesLadder />);
    fireEvent.click(screen.getByTestId("button-add-node"));
    fireEvent.change(screen.getByTestId("select-node-type"), { target: { value: "PRODUCT" } });
    expect(screen.getByTestId("select-node-product")).toHaveTextContent("Alpha · prod-alpha");
    fireEvent.change(screen.getByTestId("select-node-type"), { target: { value: "PACKAGE" } });
    expect(screen.getByTestId("select-node-package")).toHaveTextContent("Starter · pkg-starter");
  });

  it("submits canonical string product and package references", async () => {
    render(<AdminSalesLadder />);
    fireEvent.click(screen.getByTestId("button-add-node"));
    fireEvent.change(screen.getByTestId("select-node-type"), { target: { value: "PRODUCT" } });
    fireEvent.change(screen.getByTestId("select-node-product"), { target: { value: "prod-alpha" } });
    fireEvent.click(screen.getByTestId("button-save-node"));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "POST",
      "/api/admin/sales-ladder/ladders/1/nodes",
      expect.objectContaining({
        nodeType: "PRODUCT",
        productRegistryId: "prod-alpha",
        packageRegistryId: null,
      }),
    ));
    await waitFor(() => expect(screen.queryByTestId("select-node-product")).not.toBeInTheDocument());

    fireEvent.click(screen.getByTestId("button-add-node"));
    fireEvent.change(screen.getByTestId("select-node-type"), { target: { value: "PACKAGE" } });
    fireEvent.change(screen.getByTestId("select-node-package"), { target: { value: "pkg-starter" } });
    fireEvent.click(screen.getByTestId("button-save-node"));

    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "POST",
      "/api/admin/sales-ladder/ladders/1/nodes",
      expect.objectContaining({
        nodeType: "PACKAGE",
        productRegistryId: null,
        packageRegistryId: "pkg-starter",
      }),
    ));
  });

  it("keeps an edit dialog open when the server rejects a mutation", async () => {
    apiRequest.mockRejectedValueOnce(new Error("Rejected"));
    render(<AdminSalesLadder />);
    fireEvent.click(screen.getByTestId("button-edit-ladder"));
    fireEvent.click(screen.getByTestId("button-save-ladder"));
    await waitFor(() => expect(apiRequest).toHaveBeenCalled());
    expect(screen.getByTestId("input-ladder-name")).toBeInTheDocument();
  });

  it("submits ladder edits through PATCH and closes after success", async () => {
    render(<AdminSalesLadder />);
    fireEvent.click(screen.getByTestId("button-edit-ladder"));
    fireEvent.change(screen.getByTestId("input-ladder-name"), { target: { value: "Founder path revised" } });
    fireEvent.click(screen.getByTestId("button-save-ladder"));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "PATCH",
      "/api/admin/sales-ladder/ladders/1",
      expect.objectContaining({ name: "Founder path revised" }),
    ));
    await waitFor(() => expect(screen.queryByTestId("input-ladder-name")).not.toBeInTheDocument());
  });

  it("submits node ordering and active state through PATCH", async () => {
    render(<AdminSalesLadder />);
    fireEvent.click(screen.getByTestId("button-edit-node-9"));
    fireEvent.change(screen.getByTestId("input-node-sort-order"), { target: { value: "7" } });
    fireEvent.click(screen.getByTestId("input-node-active"));
    fireEvent.click(screen.getByTestId("button-save-node"));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "PATCH",
      "/api/admin/sales-ladder/nodes/9",
      expect.objectContaining({ sortOrder: 7, isActive: false }),
    ));
  });

  it("submits edge ordering and active state through PATCH", async () => {
    render(<AdminSalesLadder />);
    fireEvent.click(screen.getByTestId("button-edit-edge-11"));
    fireEvent.change(screen.getByTestId("input-edge-sort-order"), { target: { value: "8" } });
    fireEvent.click(screen.getByTestId("input-edge-active"));
    fireEvent.click(screen.getByTestId("button-save-edge"));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      "PATCH",
      "/api/admin/sales-ladder/edges/11",
      expect.objectContaining({ sortOrder: 8, isActive: false }),
    ));
  });

  it("shows readable preview warnings and L0-L5 structure", async () => {
    apiRequest.mockResolvedValue(payload.ladders[0]);
    render(<AdminSalesLadder />);
    fireEvent.click(screen.getByTestId("button-preview-ladder"));
    await waitFor(() => expect(screen.getByText("Preview warning")).toBeInTheDocument());
    expect(screen.getAllByText("L0").length).toBeGreaterThan(0);
    expect(screen.getAllByText("L5").length).toBeGreaterThan(0);
  });
});