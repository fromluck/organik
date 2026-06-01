# Organik: publicar online

## GitHub Pages

1. Crie um repositorio no GitHub chamado `organik`.
2. Envie estes arquivos para a branch `main`.
3. No GitHub, abra `Settings > Pages`.
4. Em `Build and deployment`, selecione `GitHub Actions`.
5. O workflow `.github/workflows/deploy-pages.yml` publica o app automaticamente.

## Supabase

1. Crie um projeto no Supabase.
2. Abra `SQL Editor`.
3. Execute o arquivo `supabase/schema.sql`.
4. Copie `supabase-config.example.js` para `supabase-config.js`.
5. Preencha `url` e `anonKey` com os dados do projeto.

Observacao: `supabase-config.js` nao deve guardar chaves secretas. Use apenas a anon public key.
