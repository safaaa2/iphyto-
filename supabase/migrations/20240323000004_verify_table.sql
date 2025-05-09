-- Vérifier si la table existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'Produits'
);

-- Afficher la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'Produits'
ORDER BY ordinal_position;

-- Afficher les politiques RLS
SELECT *
FROM pg_policies
WHERE tablename = 'Produits';

-- Insérer un produit de test
INSERT INTO "Produits" (
    "Produits",
    "Détenteur",
    "Numéro homologation",
    "Valable jusqu'au",
    "Tableau toxicologique",
    "Formulation",
    "Matière active",
    "Teneur",
    "Categorie",
    "Fournisseur"
) VALUES (
    'Produit Test',
    'Détenteur Test',
    '123456',
    '2024-12-31',
    'Tableau Test',
    'Formulation Test',
    'Matière Test',
    '100%',
    'Catégorie Test',
    'Fournisseur Test'
) RETURNING *; 