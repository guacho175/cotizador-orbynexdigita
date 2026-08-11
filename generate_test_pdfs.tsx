import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { QuoteDocument } from './src/components/pdf/quote-document';

const dummyBusiness = {
  id: 'b1',
  nombre: 'Orbynex Digital Services',
  rut: '76.123.456-7',
  giro: 'Consultoría TI',
  direccion: 'Av. Providencia 1234',
  telefono: '+56 9 1234 5678',
  email: 'contacto@orbynex.cl',
  sitio_web: 'www.orbynex.cl',
  banco_titular: 'Orbynex SpA',
  banco_rut: '76.123.456-7',
  banco_nombre: 'Banco Santander',
  banco_tipo_cuenta: 'Cuenta Corriente',
  banco_numero_cuenta: '0-000-1234567-8',
  banco_email: 'pagos@orbynex.cl',
  color_factura: '#0b2545'
};

const dummyQuote = {
  id: 'q1',
  numero: 100,
  fecha: new Date(),
  validez_dias: 15,
  subtotal: 100000,
  iva: 19000,
  total: 119000,
  iva_percent: 19
};

const dummyItem = {
  id: 'i1',
  descripcion: 'Desarrollo web',
  precio_unitario: 100000,
  cantidad: 1
};

async function runTests() {
  // Test 1: Normal length names
  await renderToFile(
    <QuoteDocument
      quote={dummyQuote as any}
      business={dummyBusiness}
      items={[dummyItem]}
      client={{ nombre: 'Juan Perez', rut: '12.345.678-9' } as any}
    />,
    'test-normal.pdf'
  );

  // Test 2: Long length names (90 characters)
  await renderToFile(
    <QuoteDocument
      quote={dummyQuote as any}
      business={{ ...dummyBusiness, banco_titular: 'A'.repeat(90) }}
      items={[dummyItem]}
      client={{ nombre: 'B'.repeat(90) } as any}
    />,
    'test-long.pdf'
  );

  // Test 3: Empty fields
  await renderToFile(
    <QuoteDocument
      quote={dummyQuote as any}
      business={{ id: 'b1' }}
      items={[]}
      client={null}
    />,
    'test-empty.pdf'
  );

  console.log("PDFs generated for inspection.");
}

runTests().catch(console.error);
