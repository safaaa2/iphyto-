-- Création de la table actualites
CREATE TABLE actualites (
    id SERIAL PRIMARY KEY,
    titre TEXT NOT NULL,
    contenu TEXT NOT NULL,
    date_publication DATE NOT NULL,
    image_url TEXT,
    image_alt TEXT,
    source_url TEXT,
    auteur TEXT,
    categorie TEXT CHECK (categorie IN ('maladies', 'tendances', 'sante', 'partenariats')),
    statut TEXT CHECK (statut IN ('brouillon', 'publié', 'archivé')) DEFAULT 'brouillon',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Création d'un trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_actualites_updated_at
    BEFORE UPDATE ON actualites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion des exemples d'actualités avec images
INSERT INTO actualites (titre, contenu, date_publication, categorie, auteur, image_url, image_alt, statut) VALUES
-- Maladies des Cultures
('Nouvelle souche de mildiou détectée dans la région', 
'Une nouvelle souche de mildiou a été identifiée dans les cultures de pommes de terre. Les agriculteurs sont invités à surveiller leurs parcelles et à appliquer les traitements préventifs recommandés.',
CURRENT_DATE, 'maladies', 'Service Régional de Protection des Végétaux',
'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
'Champ de pommes de terre atteint par le mildiou', 'publié'),

('Alerte : Prolifération de la pyrale du maïs', 
'Une augmentation significative des populations de pyrale du maïs a été observée dans plusieurs départements. Des mesures de lutte biologique sont recommandées.',
CURRENT_DATE, 'maladies', 'Institut National de la Recherche Agronomique',
'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
'Champ de maïs avec symptômes de pyrale', 'publié'),

-- Tendances en Matière de Cultures
('Les cultures résistantes à la sécheresse gagnent en popularité',
'Face au changement climatique, de plus en plus d''agriculteurs se tournent vers des variétés de cultures résistantes à la sécheresse. Découvrez les nouvelles variétés disponibles cette saison.',
CURRENT_DATE, 'tendances', 'Agronome Expert',
'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
'Champ de culture résistante à la sécheresse', 'publié'),

('L''agriculture de précision : l''avenir des grandes cultures',
'Les nouvelles technologies de précision permettent d''optimiser les apports d''intrants et d''améliorer significativement les rendements.',
CURRENT_DATE, 'tendances', 'Technologue Agricole',
'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
'Drone agricole en action', 'publié'),

-- Santé des Cultures
('Bilan de santé des cultures céréalières 2024',
'Le dernier rapport sur la santé des cultures céréalières montre une amélioration générale, mais des points de vigilance persistent dans certaines régions.',
CURRENT_DATE, 'sante', 'Observatoire National des Cultures',
'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
'Champ de céréales en bonne santé', 'publié'),

-- Partenariats et Initiatives
('Nouveau programme de subventions pour la lutte biologique',
'Un nouveau programme de subventions est disponible pour les agriculteurs souhaitant mettre en place des méthodes de lutte biologique contre les ravageurs.',
CURRENT_DATE, 'partenariats', 'Ministère de l''Agriculture',
'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1000',
'Signature d''un accord de partenariat', 'publié'); 