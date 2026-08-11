import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sortClients, filterClients, paginateClients } from "./clientes-utils";

describe("Clientes Logic", () => {
  test("Orden: angelica, Ángela, Farmacia, víctor, Victor 2, Victor 10", () => {
    const clients = [
      { id: 6, nombre: "Victor 10" },
      { id: 2, nombre: "Ángela" },
      { id: 1, nombre: "angelica" },
      { id: 5, nombre: "Victor 2" },
      { id: 3, nombre: "Farmacia" },
      { id: 4, nombre: "víctor" },
    ];
    
    const sorted = sortClients(clients);
    const names = sorted.map(c => c.nombre);
    
    assert.deepEqual(names, [
      "angelica",
      "Ángela",
      "Farmacia",
      "víctor",
      "Victor 2",
      "Victor 10"
    ]);
  });

  test("Búsqueda: Insensible a mayúsculas/acentos, por múltiples campos", () => {
    const clients = [
      { id: 1, nombre: "José Pérez", rut: "123", contacto: "Juan", email: "a@b.c", telefono: "999" },
      { id: 2, nombre: "Maria", rut: "456", contacto: "Pepe", email: "maria@b.c", telefono: "888" },
    ];
    
    assert.equal(filterClients(clients, "jose").length, 1);
    assert.equal(filterClients(clients, "jUÁn").length, 1);
    assert.equal(filterClients(clients, "888").length, 1);
    assert.equal(filterClients(clients, "456").length, 1);
    assert.equal(filterClients(clients, "maria@b.c").length, 1);
  });
  
  test("Paginación: Datos 0, 7, 100, 1000 clientes. Máximo 50 filas.", () => {
    const data0 = [];
    assert.equal(paginateClients(data0, 0, 50).length, 0);

    const data7 = Array.from({ length: 7 }).map((_, i) => ({ id: i }));
    assert.equal(paginateClients(data7, 0, 50).length, 7);

    const data100 = Array.from({ length: 100 }).map((_, i) => ({ id: i }));
    assert.equal(paginateClients(data100, 0, 50).length, 50);
    assert.equal(paginateClients(data100, 1, 50).length, 50);
    assert.equal(paginateClients(data100, 2, 50).length, 0);

    const data1000 = Array.from({ length: 1000 }).map((_, i) => ({ id: i }));
    assert.equal(paginateClients(data1000, 0, 50).length, 50);
    assert.equal(paginateClients(data1000, 19, 50).length, 50);
  });

  test("Rendimiento: Búsqueda con 1000 clientes < 100ms", () => {
    const data1000 = Array.from({ length: 1000 }).map((_, i) => ({ 
      id: i, 
      nombre: `Cliente ${i}`, 
      rut: `12345678-${i}`,
      contacto: `Contacto ${i}`,
      email: `correo${i}@ejemplo.com`,
      telefono: `+5691234567${i % 10}`
    }));

    const start = performance.now();
    const result = filterClients(data1000, "correo999");
    const end = performance.now();

    assert.equal(result.length, 1);
    assert.ok(end - start < 100, `Búsqueda tardó ${end - start}ms, debería ser < 100ms`);
  });
});
