-- Mise à jour de la table products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS detenteur TEXT,
ADD COLUMN IF NOT EXISTS numero_homologation TEXT,
ADD COLUMN IF NOT EXISTS valable_jusqu_au DATE,
ADD COLUMN IF NOT EXISTS tableau_toxicologique TEXT,
ADD COLUMN IF NOT EXISTS formulation TEXT,
ADD COLUMN IF NOT EXISTS matiere_active TEXT,
ADD COLUMN IF NOT EXISTS teneur TEXT,
ADD COLUMN IF NOT EXISTS categorie TEXT;

-- Mise à jour des politiques RLS
ALTER POLICY "Les fournisseurs peuvent voir leurs propres produits" ON products
    USING (auth.uid() = supplier_id);

ALTER POLICY "Les fournisseurs peuvent insérer leurs propres produits" ON products
    FOR INSERT WITH CHECK (auth.uid() = supplier_id);

ALTER POLICY "Les fournisseurs peuvent mettre à jour leurs propres produits" ON products
    FOR UPDATE USING (auth.uid() = supplier_id);

ALTER POLICY "Les fournisseurs peuvent supprimer leurs propres produits" ON products
    FOR DELETE USING (auth.uid() = supplier_id); 