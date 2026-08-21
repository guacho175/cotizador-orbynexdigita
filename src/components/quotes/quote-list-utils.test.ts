import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Client, Quote } from "@/lib/types";
import {
  buildClientMap,
  filterQuotes,
  groupQuotesByClient,
  paginateQuotes,
  sortQuotesByNumber,
} from "./quote-list-utils.ts";

function quote(overrides: Partial<Quote> & Pick<Quote, "id">): Quote {
  const { id, ...rest } = overrides;
  return {
    id,
    user_id: "user-1",
    client_id: null,
    numero: null,
    pdf_template_key: null,
    pdf_template_version: null,
    issued_at: null,
    fecha: "2026-08-21",
    validez_dias: 15,
    estado: "borrador",
    atencion: "",
    subtotal: 100,
    iva: 19,
    total: 119,
    iva_percent: 19,
    snapshot_negocio: null,
    snapshot_cliente: null,
    ...rest,
  };
}

function client(overrides: Partial<Client> & Pick<Client, "id" | "nombre">): Client {
  const { id, nombre, ...rest } = overrides;
  return {
    id,
    user_id: "user-1",
    nombre,
    rut: "",
    contacto: "",
    email: "",
    telefono: "",
    direccion: "",
    notas: "",
    pdf_template_key: null,
    ...rest,
  };
}

describe("quote list selectors", () => {
  test("keeps pending quotes separate and sorts numbers descending deterministically", () => {
    const input = [
      quote({ id: "d", numero: 200, fecha: "2026-01-01" }),
      quote({ id: "c", numero: 201, fecha: "2026-01-01", created_at: "2026-01-02" }),
      quote({ id: "b", numero: null, updated_at: "2026-01-02" }),
      quote({ id: "a", numero: null, updated_at: "2026-01-03" }),
    ];

    assert.deepEqual(
      sortQuotesByNumber(input).map((item) => item.id),
      ["a", "b", "c", "d"],
    );
    assert.deepEqual(
      sortQuotesByNumber([...input].reverse()).map((item) => item.id),
      ["a", "b", "c", "d"],
    );
  });

  test("groups by client id, never by duplicate client names", () => {
    const clients = [
      client({ id: "client-a", nombre: "Acme" }),
      client({ id: "client-b", nombre: "Acme" }),
    ];
    const groups = groupQuotesByClient(
      [
        quote({ id: "a", client_id: "client-a", numero: 200 }),
        quote({ id: "b", client_id: "client-b", numero: 201 }),
      ],
      buildClientMap(clients),
    );

    assert.equal(groups.length, 2);
    assert.deepEqual(
      groups.map((group) => group.clientId),
      ["client-a", "client-b"],
    );
  });

  test("distinguishes missing clients from quotes without a client", () => {
    const groups = groupQuotesByClient(
      [
        quote({
          id: "a",
          client_id: "deleted-id",
          snapshot_cliente: { nombre: "Cliente histórico" },
        }),
        quote({ id: "c", client_id: "another-deleted-id" }),
        quote({ id: "b", client_id: null }),
      ],
      new Map(),
    );

    assert.deepEqual(
      groups.map((group) => [group.kind, group.title]),
      [
        ["missing-client", "Cliente no disponible"],
        ["missing-client", "Cliente no disponible"],
        ["without-client", "Sin cliente"],
      ],
    );
    assert.equal(
      groups.find((group) => group.clientId === "deleted-id")?.secondaryLabel,
      "Cliente histórico",
    );
  });

  test("searches numbers with or without padding and client data without accents", () => {
    const clients = buildClientMap([
      client({ id: "client-a", nombre: "Comercialización Águila", rut: "12.345.678-9" }),
    ]);
    const quotes = [quote({ id: "a", client_id: "client-a", numero: 200 })];

    assert.equal(filterQuotes(quotes, "00200", clients).length, 1);
    assert.equal(filterQuotes(quotes, "200", clients).length, 1);
    assert.equal(filterQuotes(quotes, "aguila", clients).length, 1);
    assert.equal(filterQuotes(quotes, "12.345", clients).length, 1);
  });

  test("paginates at 50 rows without mutating the source", () => {
    const quotes = Array.from({ length: 101 }, (_, index) =>
      quote({ id: String(index), numero: index + 200 }),
    );

    assert.equal(paginateQuotes(quotes, 0).length, 50);
    assert.equal(paginateQuotes(quotes, 1).length, 50);
    assert.equal(paginateQuotes(quotes, 2).length, 1);
    assert.equal(quotes[0]?.id, "0");
  });
});
