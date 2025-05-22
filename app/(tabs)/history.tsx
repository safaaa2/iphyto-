import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Ionicons } from '@expo/vector-icons';

type Order = {
    id: string;
    created_at: string;
    statut: string;
    montant_total: number;
    produits: any[];
    user_id: string;
    adresse_livraison: string;
    telephone: string;
    nom_client: string;
    email: string;
};

export default function HistoryScreen() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                console.log('No session found');
                return;
            }
            console.log('Fetching orders for user:', session.user.id);

            const { data, error } = await supabase
                .from('commandes')
                .select(`
          id,
          created_at,
          statut,
          montant_total,
          produits,
          user_id,
          adresse_livraison,
          telephone,
          nom_client,
          email
        `)
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error details:', error);
                throw error;
            }

            console.log('Orders fetched:', data);
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <View style={styles.orderCard}>
            <View style={styles.orderHeaderRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.orderDateTime}>
                        {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            year: 'numeric', month: 'long', day: 'numeric',
                        })}
                        {' à '}
                        {new Date(item.created_at).toLocaleTimeString('fr-FR', {
                            hour: '2-digit', minute: '2-digit',
                        })}
                    </Text>
                    <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: 'green' }] }>
                    <Ionicons
                        
                        size={16}
                        color="white"
                        style={{ marginRight: 4 }}
                    />
                    <Text style={styles.statusBadgeText}>
                        {item.statut === 'livré' ? t('payé') : t('Payé')}
                    </Text>
                </View>
            </View>
            <View style={styles.productsList}>
                {Array.isArray(item.produits) && item.produits.length > 0 ? (
                    item.produits.map((prod, idx) => (
                        <View key={idx}>
                            <View style={styles.productLine}>
                                <MaterialCommunityIcons name="cube-outline" size={20} color="#008000" style={{ marginRight: 6 }} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.productName}>{prod.name || prod.nom}</Text>
                                    <View style={styles.productDetailsRow}>
                                        <Text style={styles.productDetail}>{t('quantity')}: <Text style={styles.bold}>{prod.quantity || prod.quantite}</Text></Text>
                                        <Text style={styles.productDetail}>| {t('price')}: <Text style={styles.bold}>{prod.price || prod.prix} MAD</Text></Text>
                                        {prod.unite && <Text style={styles.productDetail}>| {prod.unite}</Text>}
                                    </View>
                                </View>
                            </View>
                            {idx < item.produits.length - 1 && <View style={styles.productDivider} />}
                        </View>
                    ))
                ) : (
                    <Text style={styles.emptyText}>{t('noProducts')}</Text>
                )}
            </View>
            <View style={styles.orderFooterRow}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="location-outline" size={14} color="#888" style={{ marginRight: 3 }} />
                    <Text style={styles.customerInfo}>{item.nom_client} • {item.adresse_livraison}</Text>
                </View>
                <Text style={styles.orderTotal}>{t('total')}: <Text style={styles.bold}>{item.montant_total} MAD</Text></Text>
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#008000" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{t('orderHistory')}</Text>
            </View>

            {orders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="history" size={50} color="#666" />
                    <Text style={styles.emptyText}>{t('noOrders')}</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    listContainer: {
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 18,
        marginBottom: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 6,
    },
    orderHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderDateTime: {
        fontSize: 15,
        color: '#333',
        fontWeight: '600',
    },
    orderId: {
        fontSize: 11,
        color: '#aaa',
        marginTop: 2,
        marginLeft: 2,
        letterSpacing: 1,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 16,
        alignSelf: 'flex-start',
        minWidth: 70,
        justifyContent: 'center',
    },
    statusBadgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
        alignItems: 'center',
        textTransform: 'capitalize',
        marginLeft: 4,
    },
    productsList: {
        marginTop: 10,
        marginBottom: 10,
    },
    productLine: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f7f7f7',
        borderRadius: 6,
        padding: 8,
        marginBottom: 0,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
    },
    productDivider: {
        height: 1,
        backgroundColor: '#e0e0e0',
        marginVertical: 4,
        marginLeft: 28,
    },
    productName: {
        fontWeight: 'bold',
        color: '#222',
        fontSize: 15,
        marginBottom: 2,
    },
    productDetailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    productDetail: {
        color: '#555',
        fontSize: 13,
        marginRight: 8,
    },
    bold: {
        fontWeight: 'bold',
        color: '#008000',
    },
    orderFooterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 10,
        marginTop: 10,
    },
    customerInfo: {
        fontSize: 12,
        color: '#888',
        fontStyle: 'italic',
        flexShrink: 1,
    },
    orderTotal: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#008000',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
}); 