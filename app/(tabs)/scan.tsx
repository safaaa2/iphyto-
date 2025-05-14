import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

interface ProductInfo {
    nom: string;
    catégorie: string;
    matière_active: string;
    teneur: string;
    valable_jusqu_au: string;
  }
  
export default function ScanScreen() {
    
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);

    useEffect(() => {
        (async () => {
            const { status } = await BarCodeScanner.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const handleScan = ({ data }) => {
        setScanned(true);
        try {
            const json = JSON.parse(data);
            setProductInfo(json);
        } catch {
            Alert.alert('QR Code invalide', 'Le contenu scanné n\'est pas un format JSON valide.');
        }
    };

    if (hasPermission === null) {
        return <ActivityIndicator style={{ marginTop: 50 }} />;
    }

    if (hasPermission === false) {
        return (
            <View style={styles.centered}>
                <Text style={styles.error}>Permission caméra refusée.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {!scanned && (
                <BarCodeScanner
                    onBarCodeScanned={scanned ? undefined : handleScan}
                    style={StyleSheet.absoluteFillObject}
                />
            )}

            {scanned && productInfo && (
                <View style={styles.card}>
                    <Text style={styles.title}>✅ Produit détecté</Text>
                    <Text>📦 Nom : {productInfo.nom}</Text>
                    <Text>📂 Catégorie : {productInfo.catégorie}</Text>
                    <Text>🧪 Matière active : {productInfo.matière_active}</Text>
                    <Text>📏 Teneur : {productInfo.teneur}</Text>
                    <Text>📅 Valable jusqu'au : {productInfo.valable_jusqu_au}</Text>
                    <Button title="Scanner un autre" onPress={() => {
                        setScanned(false);
                        setProductInfo(null);
                    }} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    error: { fontSize: 16, color: 'red' },
    card: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: '#fff',
        padding: 20,
        width: '100%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
});
