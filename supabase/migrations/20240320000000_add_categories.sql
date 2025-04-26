-- Ajout de la colonne categorie à la table actualites
ALTER TABLE actualites ADD COLUMN categorie TEXT CHECK (categorie IN ('maladies', 'tendances', 'sante', 'partenariats'));

-- Exemples d'actualités pour chaque catégorie
INSERT INTO actualites (titre, contenu, date_publication, categorie, auteur) VALUES
-- Maladies des Cultures
('Nouvelle souche de mildiou détectée dans la région', 
'Une nouvelle souche de mildiou a été identifiée dans les cultures de pommes de terre. Les agriculteurs sont invités à surveiller leurs parcelles et à appliquer les traitements préventifs recommandés.',
CURRENT_DATE, 'maladies', 'Service Régional de Protection des Végétaux'),

('Alerte : Prolifération de la pyrale du maïs', 
'Une augmentation significative des populations de pyrale du maïs a été observée dans plusieurs départements. Des mesures de lutte biologique sont recommandées.',
CURRENT_DATE, 'maladies', 'Institut National de la Recherche Agronomique'),

('Nouveau traitement contre la rouille du blé', 
'Un nouveau traitement biologique efficace contre la rouille du blé vient d''être homologué. Les essais montrent une réduction de 80% des pertes de rendement.',
CURRENT_DATE, 'maladies', 'Laboratoire Phytosanitaire National'),

-- Tendances en Matière de Cultures
('Les cultures résistantes à la sécheresse gagnent en popularité',
'Face au changement climatique, de plus en plus d''agriculteurs se tournent vers des variétés de cultures résistantes à la sécheresse. Découvrez les nouvelles variétés disponibles cette saison.',
CURRENT_DATE, 'tendances', 'Agronome Expert'),

('L''agriculture de précision : l''avenir des grandes cultures',
'Les nouvelles technologies de précision permettent d''optimiser les apports d''intrants et d''améliorer significativement les rendements.',
CURRENT_DATE, 'tendances', 'Technologue Agricole'),

('Le retour des cultures anciennes : une tendance durable',
'Les agriculteurs redécouvrent les avantages des variétés anciennes, plus résistantes et adaptées aux conditions locales.',
CURRENT_DATE, 'tendances', 'Conservatoire des Variétés Anciennes'),

-- Santé des Cultures
('Bilan de santé des cultures céréalières 2024',
'Le dernier rapport sur la santé des cultures céréalières montre une amélioration générale, mais des points de vigilance persistent dans certaines régions.',
CURRENT_DATE, 'sante', 'Observatoire National des Cultures'),

('Surveillance renforcée des cultures maraîchères',
'Un nouveau système de surveillance permet de détecter précocement les problèmes de santé dans les cultures maraîchères.',
CURRENT_DATE, 'sante', 'Centre Technique Interprofessionnel des Fruits et Légumes'),

('Indicateurs de santé des sols : les nouvelles normes',
'De nouveaux indicateurs permettent d''évaluer plus précisément la santé des sols et leur capacité à soutenir des cultures saines.',
CURRENT_DATE, 'sante', 'Institut de Recherche en Agronomie'),

-- Partenariats et Initiatives
('Nouveau programme de subventions pour la lutte biologique',
'Un nouveau programme de subventions est disponible pour les agriculteurs souhaitant mettre en place des méthodes de lutte biologique contre les ravageurs.',
CURRENT_DATE, 'partenariats', 'Ministère de l''Agriculture'),

('Partenariat public-privé pour la recherche agronomique',
'Une nouvelle collaboration entre instituts de recherche et entreprises privées vise à accélérer l''innovation dans le domaine agricole.',
CURRENT_DATE, 'partenariats', 'Agence Nationale de la Recherche'),

('Initiative européenne pour l''agriculture durable',
'Un nouveau programme européen soutient les projets innovants en matière d''agriculture durable et de préservation de la biodiversité.',
CURRENT_DATE, 'partenariats', 'Commission Européenne'); 