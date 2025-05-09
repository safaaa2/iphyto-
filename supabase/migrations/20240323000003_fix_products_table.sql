-- Désactiver temporairement RLS pour la table Produits
ALTER TABLE IF EXISTS "Produits" DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "Permettre l'insertion de produits" ON "Produits";
DROP POLICY IF EXISTS "Permettre la sélection de produits" ON "Produits";
DROP POLICY IF EXISTS "Permettre la mise à jour de produits" ON "Produits";
DROP POLICY IF EXISTS "Permettre la suppression de produits" ON "Produits";

-- Vérifier si la table existe, sinon la créer
CREATE TABLE IF NOT EXISTS "Produits" (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "Produits" TEXT,
    "Détenteur" TEXT,
    "Numéro homologation" TEXT,
    "Valable jusqu'au" TEXT,
    "Tableau toxicologique" TEXT,
    "Formulation" TEXT,
    "Matière active" TEXT,
    "Teneur" TEXT,
    "Categorie" TEXT,
    "Fournisseur" TEXT
);

-- Activer RLS
ALTER TABLE "Produits" ENABLE ROW LEVEL SECURITY;

-- Créer une politique simple pour permettre toutes les opérations aux utilisateurs authentifiés
CREATE POLICY "enable_all_for_authenticated" ON "Produits"
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true); 