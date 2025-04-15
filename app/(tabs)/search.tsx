import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { supabase } from '../../lib/supabase';

type utilisation = {
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

const AdvancedSearch = () => {
  const [Produits, setProduits] = useState('');
  const [Matière_active, setMatièreactive] = useState('');
  const [Cultures, setCultures] = useState('');
  const [Cible, setCible] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<utilisation[]>([]);

  const handleSearch = () => {
    setLoading(true);
    
   
  };

  const handleApplyFilters = async () => {
    setLoading(true);

    let query = supabase
      .from('utilisation')
      .select('*')
      .order('Produits', { ascending: true });

      if (Produits) query = query.ilike('Produits', `${Produits}%`); // Ici, % après `Produits` signifie que les produits doivent commencer par le texte saisi.
      if (Matière_active) query = query.ilike('Matière active', `%${Matière_active}%`);
      if (Cultures) query = query.ilike('Cultures', `%${Cultures}%`);
      if (Cible) query = query.ilike('Cible', `%${Cible}%`);

    try {
      const { data, error } = await query;

      if (error) {
        console.error('Erreur lors de la récupération des produits:', error);
        setLoading(false);
        return;
      }

      const enhancedData = await Promise.all(
        data.map(async (item) => {
          const { data: productData, error } = await supabase
            .from('Produits')
            .select('Fournisseur, Détenteur, "Tableau toxicologique",Categorie')
            .eq('Numéro homologation', item['Numéro homologation'])
            .single();

          if (error) {
            console.error('Erreur lors de la récupération des informations du produit:', error);
            return { ...item, Fournisseur: null, Détenteur: null, 'Tableau toxicologique': null };
          }

          return { ...item, ...productData };
        })
      );

      setFilteredProducts(enhancedData);
    } catch (error) {
      console.error('Erreur de requête:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setProduits('');
    setMatièreactive('');
    setCultures('');
    setCible('');
    setShowFilters(false);
    setFilteredProducts([]);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(!showFilters)}>
        <Icon name="filter-list" size={20} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Filtrer les produits</Text>
      </TouchableOpacity>
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            {[{ label: 'Nom de produit', value: Produits, setValue: setProduits },
            { label: 'Matière active', value: Matière_active, setValue: setMatièreactive },
            { label: 'Culture Concernée', value: Cultures, setValue: setCultures },
            { label: 'Maladie/Cible', value: Cible, setValue: setCible }
            ].map((field, index) => (
              <View key={index} style={styles.inputGroup}>
                <Text style={styles.label}>{field.label}</Text>
                <View style={styles.inputWrapper}>
                  <Icon name="search" size={20} color="gray" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={field.label}
                    value={field.value}
                    placeholderTextColor="gray"
                    onChangeText={text => field.setValue(text)}
                  />
                </View>
              </View>
            ))}
          </View>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
              <Icon name="clear" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
              <Icon name="filter-list" size={20} color="white" style={styles.icon} />
              <Text style={styles.buttonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#008000" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}
      {!loading && filteredProducts.length > 0 && (
        <FlatList
          data={filteredProducts}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <Text style={styles.productName}>
                  <Icon name="local-offer" size={16} color="green" /> {item.Produits}
                </Text>
                <Text style={styles.productDetail1}>
                  <Icon name="" size={16} color="green" /> {item.Categorie || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="science" size={16} color="green" /> {item['Matière active'] || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="agriculture" size={16} color="green" /> {item.Cultures || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="bug-report" size={16} color="green" /> {item.Cible || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="opacity" size={16} color="green" /> Dose:{item.Dose || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="hourglass-bottom" size={16} color="green" /> DAR: {item.DAR || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="confirmation-number" size={16} color="green" /> Numéro homologation: {item["Numéro homologation"] || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="local-shipping" size={16} color="green" /> Fournisseur: {item.Fournisseur || 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="person" size={16} color="green" /> Détenteur: {item.Détenteur ? item.Détenteur : 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="report-problem" size={16} color="red" /> Tableau toxicologique: {item["Tableau toxicologique"] ? item["Tableau toxicologique"] : 'Non spécifié'}
                </Text>
                <Text style={styles.productDetail}>
                  <Icon name="event" size={16} color="black" /> Valable jusqu'au: {new Date().toLocaleDateString('fr-FR')}
                </Text>
              </View>
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      )}
      {filteredProducts.length === 0 && !loading && (
        <Text style={styles.noResultsText}>Aucun produit trouvé.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  filterButton: {
    backgroundColor: '#008000',
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  filtersContainer: {
    padding: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  inputGroup: {
    width: '48%',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    backgroundColor: 'white',
    paddingHorizontal: 10,
  },
  inputIcon: {
    marginRight: 5,
  },
  input: {
    flex: 1,
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  clearButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  applyButton: {
    backgroundColor: '#008000',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 5,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'gray',
  },
  cardContainer: {
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productDetail: {
    fontSize: 14,
    color: 'black',
    
  },
  productDetail1: {
    fontSize: 14,
    color: 'black',
    marginBottom: 15,
    
  },
  noResultsText: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default AdvancedSearch;
