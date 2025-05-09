-- Supprimer les anciennes politiques
DROP POLICY IF EXISTS "Les fournisseurs peuvent voir leurs propres produits" ON "Produits";
DROP POLICY IF EXISTS "Les fournisseurs peuvent insérer leurs propres produits" ON "Produits";
DROP POLICY IF EXISTS "Les fournisseurs peuvent mettre à jour leurs propres produits" ON "Produits";
DROP POLICY IF EXISTS "Les fournisseurs peuvent supprimer leurs propres produits" ON "Produits";

-- Créer une politique plus permissive pour l'insertion
CREATE POLICY "Permettre l'insertion de produits"
ON "Produits"
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Créer une politique pour la sélection
CREATE POLICY "Permettre la sélection de produits"
ON "Produits"
FOR SELECT
TO authenticated
USING (true);

-- Créer une politique pour la mise à jour
CREATE POLICY "Permettre la mise à jour de produits"
ON "Produits"
FOR UPDATE
TO authenticated
USING (true);

-- Créer une politique pour la suppression
CREATE POLICY "Permettre la suppression de produits"
ON "Produits"
FOR DELETE
TO authenticated
USING (true); 