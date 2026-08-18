# BareBar Next

Ny Vercel/Supabase-versjon av BareBar.

## Funksjoner
- Cocktailbibliotek
- Flasker med flaskestørrelse og faktisk restmengde i ml
- Automatisk lagerfratrekk når en cocktail lages
- Støtte for flere flasker av samme ingrediens
- Lavgrense per flaske og automatisk handleliste
- Transaksjonshistorikk i databasen
- RLS per innlogget bruker
- Responsivt grensesnitt
- Demo-data dersom Supabase ikke er konfigurert

## Oppsett
1. Opprett et eget Supabase-prosjekt for BareBar.
2. Kjør `supabase/schema.sql` i prosjektet.
3. Legg `NEXT_PUBLIC_SUPABASE_URL` og `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` inn som environment variables i Vercel.
4. Deploy repoet med branch `vercel-supabase`.

Den eksisterende Supabase-databasen som brukes av andre apper bør ikke gjenbrukes.
