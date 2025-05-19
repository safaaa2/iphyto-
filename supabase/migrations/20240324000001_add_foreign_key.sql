-- Ajouter la clé étrangère entre cart_items et utilisation
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES utilisation("Numéro homologation")
ON DELETE CASCADE; 