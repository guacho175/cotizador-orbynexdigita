import type { Business, Client, Quote, QuoteItem } from "../../src/lib/types";
import type { QuoteDocumentProps } from "../../src/components/pdf/quote-document";

const FIXED_DATE = "2026-08-21";

const business: Business = {
  id: "business-fixture",
  user_id: "user-fixture",
  nombre: "Orbynex Digital Services",
  rut: "76.123.456-7",
  giro: "Consultoría TI",
  direccion: "Av. Providencia 1234, Santiago",
  telefono: "+56 9 1234 5678",
  email: "contacto@orbynex.cl",
  sitio_web: "www.orbynex.cl",
  logo_path: null,
  banco_titular: "Orbynex SpA",
  banco_rut: "76.123.456-7",
  banco_nombre: "Banco Santander",
  banco_tipo_cuenta: "Cuenta Corriente",
  banco_numero_cuenta: "000012345678",
  banco_email: "pagos@orbynex.cl",
  condiciones: "Valores expresados en pesos chilenos.",
  pie_pagina: "Orbynex Digital Services - contacto@orbynex.cl",
  iva_percent: 19,
  next_quote_number: 201,
  color_factura: "#0b2545",
  pdf_template_key: "standard-v1",
};

const client: Client = {
  id: "client-fixture",
  user_id: "user-fixture",
  nombre: "Cliente de validación multipágina SpA",
  rut: "77.765.432-1",
  contacto: "Ana Pérez",
  email: "ana.perez@cliente-validacion.cl",
  telefono: "+56 9 8765 4321",
  direccion: "Av. Apoquindo 4501, Las Condes, Santiago",
  notas: "Fixture determinista",
  pdf_template_key: null,
};

function repeatToLength(seed: string, length: number): string {
  return `${seed} `
    .repeat(Math.ceil(length / (seed.length + 1)))
    .slice(0, length)
    .trim();
}

function makeItem(index: number, description?: string): QuoteItem {
  const unitPrice = 45000 + index * 8750;
  const quantity = (index % 3) + 1;
  return {
    id: `item-${String(index).padStart(2, "0")}`,
    quote_id: "quote-fixture",
    user_id: "user-fixture",
    orden: index,
    descripcion:
      description ||
      `Servicio ${index}\nImplementación | Entrega controlada\nConfiguración y validación funcional del componente ${index}.\nEl servicio incluye:\n- Preparación del entorno\n- Implementación técnica\n- Revisión y entrega`,
    cantidad: quantity,
    precio_unitario: unitPrice,
    total: unitPrice * quantity,
  };
}

function makeQuote(items: QuoteItem[], overrides: Partial<Quote> = {}): Quote {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const iva = Math.round(subtotal * 0.19);
  return {
    id: "quote-fixture",
    user_id: "user-fixture",
    client_id: client.id,
    numero: 200,
    pdf_template_key: "standard-v1",
    pdf_template_version: 1,
    issued_at: "2026-08-21T12:00:00.000Z",
    fecha: FIXED_DATE,
    validez_dias: 15,
    estado: "borrador",
    atencion: "Ana Pérez",
    subtotal,
    iva,
    total: subtotal + iva,
    iva_percent: 19,
    snapshot_negocio: null,
    snapshot_cliente: null,
    observaciones: "Fixture de control visual determinista.",
    ...overrides,
  };
}

function fixture(name: string, items: QuoteItem[], quoteOverrides?: Partial<Quote>) {
  return {
    name,
    props: {
      quote: makeQuote(items, quoteOverrides),
      items,
      business,
      client,
      logoDataUrl: null,
    } satisfies QuoteDocumentProps,
  };
}

const items1 = [makeItem(1)];
const items3 = Array.from({ length: 3 }, (_, index) => makeItem(index + 1));
const items10 = Array.from({ length: 10 }, (_, index) => makeItem(index + 1));
const items30 = Array.from({ length: 30 }, (_, index) => makeItem(index + 1));
const item1200 = [
  makeItem(
    1,
    repeatToLength(
      "Servicio de implementación detallada con levantamiento, configuración, pruebas y entrega documentada.",
      1200,
    ),
  ),
];
const overPageItem = [
  makeItem(
    1,
    [
      "IMPLEMENTACIÓN INTEGRAL MULTIETAPA",
      "Arquitectura | Desarrollo | Control de calidad",
      repeatToLength(
        "El alcance contempla análisis, configuración, validación y registro de cada decisión técnica.",
        4200,
      ),
      "El servicio incluye:",
      ...Array.from(
        { length: 28 },
        (_, index) =>
          `- Etapa ${index + 1}: ${repeatToLength(
            "ejecución verificable con criterios de aceptación y evidencia de cierre",
            170,
          )}`,
      ),
    ].join("\n"),
  ),
];

export const PDF_QA_FIXTURES = [
  fixture("01-un-producto", items1),
  fixture("03-tres-productos", items3),
  fixture("10-diez-productos", items10),
  fixture("30-treinta-productos", items30),
  fixture("descripcion-1200-caracteres", item1200),
  fixture("producto-mayor-que-pagina", overPageItem, {
    observaciones: repeatToLength(
      "Observación extensa separable para comprobar viudas, huérfanas y cierre independiente.",
      1200,
    ),
  }),
] as const;
