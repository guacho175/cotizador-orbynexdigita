export function normalize(str: string): string {
  if (!str) return "";
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export const sortClients = (clients: any[]) => {
  const collator = new Intl.Collator("es-CL", { sensitivity: "base", numeric: true });
  return clients.slice().sort((a, b) => {
    const res = collator.compare(a.nombre, b.nombre);
    if (res !== 0) return res;
    if (a.nombre !== b.nombre) {
      return a.nombre < b.nombre ? -1 : 1;
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
};

export const filterClients = (clients: any[], term: string) => {
  const normalizedTerm = normalize(term.trim());
  if (!normalizedTerm) return clients;

  return clients.filter((c) => {
    const searchable = [
      c.nombre,
      c.rut,
      c.contacto,
      c.email,
      c.telefono,
    ]
      .filter(Boolean)
      .join(" ");
    return normalize(searchable).includes(normalizedTerm);
  });
};

export const paginateClients = (clients: any[], page: number, pageSize: number) => {
  const start = page * pageSize;
  return clients.slice(start, start + pageSize);
};
