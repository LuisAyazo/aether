import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
  // El código de abajo nunca se ejecutará debido a la redirección,
  // pero es una buena práctica tener un return por si acaso.
  // En este caso, como redirect() lanza una excepción, no es estrictamente necesario.
  // return null; 
}
