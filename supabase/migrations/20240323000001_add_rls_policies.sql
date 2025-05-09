-- Activer RLS sur la table Produits
ALTER TABLE "Produits" ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre aux fournisseurs de voir leurs propres produits
CREATE POLICY "Les fournisseurs peuvent voir leurs propres produits"
ON "Produits"
FOR SELECT
USING (
  "Fournisseur" IN (
    SELECT fournisseur 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Créer une politique pour permettre aux fournisseurs d'insérer leurs propres produits
CREATE POLICY "Les fournisseurs peuvent insérer leurs propres produits"
ON "Produits"
FOR INSERT
WITH CHECK (
  "Fournisseur" IN (
    SELECT fournisseur 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Créer une politique pour permettre aux fournisseurs de mettre à jour leurs propres produits
CREATE POLICY "Les fournisseurs peuvent mettre à jour leurs propres produits"
ON "Produits"
FOR UPDATE
USING (
  "Fournisseur" IN (
    SELECT fournisseur 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Créer une politique pour permettre aux fournisseurs de supprimer leurs propres produits
CREATE POLICY "Les fournisseurs peuvent supprimer leurs propres produits"
ON "Produits"
FOR DELETE
USING (
  "Fournisseur" IN (
    SELECT fournisseur 
    FROM profiles 
    WHERE id = auth.uid()
  )
); 