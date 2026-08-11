import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { QuoteDocument } from './src/components/pdf/quote-document';

const dummyBusiness = {
  banco_titular: 'Juan Perez',
  banco_rut: '12.345.678-9',
  banco_nombre: 'Banco de Chile',
  banco_tipo_cuenta: 'Cuenta Corriente',
  banco_numero_cuenta: '1234567890',
  banco_email: 'juan@perez.cl',
  color_factura: '#000000'
};

const dummyQuote = { 
  numero: 1, 
  created_at: new Date().toISOString(), 
  grand_total: 1000, 
  valid_until: new Date().toISOString(),
  fecha: new Date().toISOString(),
  validez_dias: 15
};
const dummyClient = { id: '1', first_name: 'Test', last_name: 'Client', email: 'test@example.com' };

renderToFile(
  <QuoteDocument quote={dummyQuote as any} items={[]} business={dummyBusiness as any} client={dummyClient as any} logoDataUrl={null} />,
  'test-quote.pdf'
).then(() => {
  console.log('PDF generated successfully');
}).catch(err => {
  console.error('Error generating PDF:', err);
});
