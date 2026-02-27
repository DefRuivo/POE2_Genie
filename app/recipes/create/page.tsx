import { redirect } from 'next/navigation';

export default function RecipesCreateRedirectPage() {
  redirect('/builds/create');
}
