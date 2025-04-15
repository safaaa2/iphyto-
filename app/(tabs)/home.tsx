import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type Utilisation = {
  Produits: string;
  Cible: string;
  Cultures: string;
  "Numéro homologation"?: string;
  "Valable jusqu'au"?: string;
  "Matière active"?: string;
  Fournisseur?: string;
  Détenteur?: string;
  Dose?: string;
  DAR?: string;
  "Nbr_d'app"?: string;
  Formulation?: string;
  Categorie?: string | null;
  "Tableau toxicologique"?: string;
  Teneur?: string;
};

const PAGE_SIZE = 12;

const Home = () => {
  const [utilisations, setUtilisations] = useState<Utilisation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const fetchUtilisations = async () => {
    setErrorMsg(null);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { count, error } = await supabase
      .from('utilisation')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('Erreur lors de la récupération du nombre total:', error);
      setErrorMsg("Erreur lors de la récupération des données.");
      setLoading(false);
      return;
    }

    const adjustedTo = to >= count! ? count! - 1 : to;

    const { data, error: fetchError } = await supabase
      .from('utilisation')
      .select('*')
      .range(from, adjustedTo)
      .order('Produits', { ascending: true });

    if (fetchError) {
      console.error('Erreur lors de la récupération:', fetchError);
      setErrorMsg("Erreur lors du chargement des données.");
      setLoading(false);
      return;
    }

    const utilisationsWithDetails = await Promise.all(
      data.map(async (utilisation: Utilisation) => {
        const { data: produitData, error: produitError } = await supabase
          .from('Produits')
          .select('Categorie, Formulation, Détenteur, Fournisseur, "Tableau toxicologique", "Matière active", Teneur')
          .eq('Numéro homologation', utilisation["Numéro homologation"])
          .single();

        if (produitError) {
          console.error('Erreur lors de la récupération des infos produit:', produitError);
        }

        return {
          ...utilisation,
          Categorie: produitData?.Categorie || null,
          Formulation: produitData?.Formulation || null,
          Détenteur: produitData?.Détenteur || null,
          Fournisseur: produitData?.Fournisseur || null,
          "Tableau toxicologique": produitData?.["Tableau toxicologique"] || null,
          "Matière active": produitData?.["Matière active"] || null,
          Teneur: produitData?.Teneur || null,
        };
      })
    );

    setUtilisations(utilisationsWithDetails);
    setHasMore(adjustedTo < count! - 1);
    setLoading(false);
  };

  useEffect(() => {
    fetchUtilisations();
  }, [page]);

  const loadMore = () => {
    if (hasMore) setPage((prev) => prev + 1);
  };

  const goBack = () => {
    if (page > 1) setPage((prev) => prev - 1);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 10 }}>
        Liste des Produits
      </Text>

      {/* Pagination */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <TouchableOpacity
          onPress={goBack}
          disabled={page === 1}
          style={{
            backgroundColor: page === 1 ? '#ddd' : 'green',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            width: 100,
            marginRight: 10,
          }}
        >
          <Icon name="chevron-left" size={16} color="white" />
          <Text style={{ color: 'white', marginLeft: -1, fontSize: 13, fontWeight: 'bold' }}>Précédent</Text>
        </TouchableOpacity>

        <Text style={{ fontWeight: 'bold', fontSize: 15, textAlign: 'center', marginHorizontal: 10 }}>
          Page {page}
        </Text>

        <TouchableOpacity
          onPress={loadMore}
          disabled={!hasMore}
          style={{
            backgroundColor: !hasMore ? '#ddd' : 'green',
            paddingVertical: 6,
            paddingHorizontal: 10,
            borderRadius: 5,
            flexDirection: 'row',
            alignItems: 'center',
            width: 100,
            marginLeft: 10,
          }}
        >
          <Text style={{ color: 'white', marginRight: 1, fontSize: 13, fontWeight: 'bold' }}>Suivant</Text>
          <Icon name="chevron-right" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {errorMsg && (
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{errorMsg}</Text>
      )}

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={utilisations}
          keyExtractor={(item, index) => `${item.Produits}-${index}`}
          renderItem={({ item, index }) => (
            <View style={{ padding: 15, marginVertical: 5, backgroundColor: '#f9f9f9', borderRadius: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <Icon name="leaf" size={18} color="green" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{item.Produits}</Text>
              </View>

              {item.Categorie && (
                <Text style={{ fontSize: 14, color: 'black', marginBottom: 20}}>{item.Categorie}</Text>
              )}

              {item.Formulation && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icon name="flask" size={16} color="green" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14 }}>{item.Formulation}</Text>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Icon name="tree" size={20} color="green" style={{ marginRight: 6 }} />
                <View style={{
                  borderWidth: 1,
                  borderColor: 'black',
                  backgroundColor: 'white',
                  borderRadius: 20,
                  paddingVertical: 4,
                  paddingHorizontal: 12,
                }}>
                  <Text style={{ fontSize: 14, color: 'black' }}>{item.Cultures}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                <Icon name="bug" size={18} color="green" style={{ marginRight: 8 }} />
                <TouchableOpacity
                  style={{
                    backgroundColor: '#2e7d32',
                    borderRadius: 20,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                  }}
                  onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
                >
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>
                    {item.Cultures} / {item.Cible}
                  </Text>
                </TouchableOpacity>
              </View>

              {item["Valable jusqu'au"] && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                  <Icon name="calendar" size={16} color="green" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, color: 'black' }}>
                    Valable jusqu’au : {new Date(item["Valable jusqu'au"]).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </Text>
                </View>
              )}

              {selectedIndex === index && (
                <View style={{ marginTop: 10, backgroundColor: '#e6f5ea', borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 5 }}>Détails :</Text>

                  {item.Fournisseur && <Text style={{ marginBottom: 4 }}>Fournisseur : {item.Fournisseur}</Text>}
                  {item.Détenteur && <Text style={{ marginBottom: 4 }}>Détenteur : {item.Détenteur}</Text>}
                  {item["Matière active"] && <Text style={{ marginBottom: 4 }}>Matière active : {item["Matière active"]}</Text>}
                  {item.Teneur && <Text style={{ marginBottom: 4 }}>Teneur : {item.Teneur}</Text>}
                  {item.Dose && <Text style={{ marginBottom: 4 }}>Dose : {item.Dose}</Text>}
                  {item.DAR && <Text style={{ marginBottom: 4 }}>DAR : {item.DAR}</Text>}
                  {item["Nbr_d'app"] && <Text style={{ marginBottom: 4 }}>Nombre d'applications : {item["Nbr_d'app"]}</Text>}
                  {item["Numéro homologation"] && <Text style={{ marginBottom: 4 }}>Numéro homologation: {item["Numéro homologation"]}</Text>}
                  {item["Tableau toxicologique"] && <Text style={{ marginBottom: 4 }}>Tableau toxicologique : {item["Tableau toxicologique"]}</Text>}
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

export default Home;
