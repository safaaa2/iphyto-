import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';

interface Actualite {
  id: number;
  titre: string;
  contenu: string;
  date_publication: string;
  image_url?: string;
  image_alt?: string;
  source_url?: string;
  auteur?: string;
  categorie: 'maladies' | 'tendances' | 'sante' | 'partenariats';
  statut: 'brouillon' | 'publié' | 'archivé';
}

const CATEGORIES = [
  { id: 'toutes', title: 'Toutes les actualités' },
  { id: 'maladies', title: 'Maladies des Cultures' },
  { id: 'tendances', title: 'Tendances Agricoles' },
  { id: 'sante', title: 'Santé des Cultures' },
  { id: 'partenariats', title: 'Partenariats' },
];

const HomeScreen = () => {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('toutes');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();

  const fetchActualites = useCallback(async () => {
    try {
      let query = supabase
        .from('actualites')
        .select('*')
        .eq('statut', 'publié')
        .order('date_publication', { ascending: false });

      if (selectedCategory !== 'toutes') {
        query = query.eq('categorie', selectedCategory);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setActualites(data || []);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchActualites();
  }, [fetchActualites]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActualites();
  }, [fetchActualites]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
        <TouchableOpacity 
          style={{ marginTop: 20, padding: 10, backgroundColor: '#22c55e', borderRadius: 5 }}
          onPress={() => {
            setLoading(true);
            setError(null);
            fetchActualites();
          }}
        >
          <Text style={{ color: 'white' }}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }: { item: Actualite }) => (
    <View
      style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
    >
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          style={{
            width: '100%',
            height: 200,
            borderRadius: 12,
            marginBottom: 12,
          }}
          alt={item.image_alt}
        />
      )}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#14532d' }}>{item.titre}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
        {new Date(item.date_publication).toLocaleDateString('fr-FR')} {item.auteur ? `• ${item.auteur}` : ''}
      </Text>
      <Text style={{ fontSize: 14, marginTop: 8 }} numberOfLines={3}>
        {item.contenu}
      </Text>
      {item.source_url && (
        <TouchableOpacity
          onPress={() => navigation.push('webview', { url: item.source_url })}
        >
          <Text style={{ color: '#22c55e', marginTop: 8 }}>Lire plus ➤</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', margin: 16, color: '#14532d' }}>
        📰 Dernières actualités
      </Text>
      
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 }}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCategory(item.id)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                borderRadius: 20,
                backgroundColor: selectedCategory === item.id ? '#22c55e' : '#e5e7eb',
              }}
            >
              <Text
                style={{
                  color: selectedCategory === item.id ? 'white' : '#374151',
                  fontWeight: '500',
                }}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <FlatList
        data={actualites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Text style={{ color: '#6b7280' }}>Aucune actualité disponible</Text>
            </View>
          )
        }
      />
    </View>
  );
};

export default HomeScreen;