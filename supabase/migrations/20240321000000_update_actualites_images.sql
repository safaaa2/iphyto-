-- Mise à jour des images des actualités existantes
UPDATE actualites 
SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
    image_alt = 'Champ de pommes de terre atteint par le mildiou'
WHERE categorie = 'maladies' AND titre LIKE '%mildiou%';

UPDATE actualites 
SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
    image_alt = 'Champ de maïs avec symptômes de pyrale'
WHERE categorie = 'maladies' AND titre LIKE '%pyrale%';

UPDATE actualites 
SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
    image_alt = 'Champ de culture résistante à la sécheresse'
WHERE categorie = 'tendances' AND titre LIKE '%sécheresse%';

UPDATE actualites 
SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
    image_alt = 'Drone agricole en action'
WHERE categorie = 'tendances' AND titre LIKE '%précision%';

UPDATE actualites 
SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
    image_alt = 'Champ de céréales en bonne santé'
WHERE categorie = 'sante';

UPDATE actualites 
SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
    image_alt = 'Signature d''un accord de partenariat'
SET image_url = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000'
WHERE categorie = 'partenariats'; 