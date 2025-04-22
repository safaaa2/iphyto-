import React, { useState, useEffect } from 'react';
import { View, Alert, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { Button, Input, Text, Card } from '@rneui/themed';
import { useSession } from '../session/sessionContext';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const Profile = () => {
  const { session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  useEffect(() => {
    if (session?.user) {
      getProfile();
      // Nettoyer les fichiers obsolètes
      cleanupOldFiles();
    }
  }, [session]);

  const getAvatarUrl = async (userId: string, currentUrl?: string) => {
    try {
      if (!currentUrl) return DEFAULT_AVATAR;

      // Vérifier si l'URL est l'image par défaut
      if (currentUrl === DEFAULT_AVATAR) return DEFAULT_AVATAR;

      // Extraire le nom du fichier de l'URL
      const fileName = currentUrl.split('/').pop()?.split('?')[0];
      if (!fileName) return DEFAULT_AVATAR;

      const filePath = `${userId}/${fileName}`;

      // Vérifier si le fichier existe
      const { data: fileExists } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (!fileExists?.some(file => file.name === fileName)) {
        console.log('Fichier non trouvé, utilisation de l\'image par défaut');
        return DEFAULT_AVATAR;
      }

      // Générer une nouvelle URL signée
      const { data: signedUrl, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 jours

      if (error || !signedUrl?.signedUrl) {
        console.error('Erreur génération URL signée:', error);
        return DEFAULT_AVATAR;
      }

      return signedUrl.signedUrl;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL:', error);
      return DEFAULT_AVATAR;
    }
  };

  const getProfile = async () => {
    try {
      if (!session?.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUsername(profile.username || '');
        if (profile.avatar_url) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(profile.avatar_url.split('/').pop() || '');
          setAvatarUrl(publicUrl || DEFAULT_AVATAR);
        } else {
          setAvatarUrl(DEFAULT_AVATAR);
        }
      }
    } catch (error) {
      setAvatarUrl(DEFAULT_AVATAR);
    }
  };

  const pickImage = async () => {
    try {
      console.log('1. Début de la sélection d\'image');
      
      // Vérifier les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('2. Statut de la permission:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission nécessaire', 'Veuillez autoriser l\'accès à la galerie dans les paramètres de l\'application.');
        return;
      }

      // Ouvrir le sélecteur d'image
      console.log('3. Ouverture du sélecteur d\'image');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log('4. Résultat de la sélection:', JSON.stringify(result, null, 2));

      // Vérifier le résultat
      if (result.canceled) {
        console.log('Sélection annulée par l\'utilisateur');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('Aucune image sélectionnée');
        return;
      }

      const selectedImage = result.assets[0];
      console.log('5. Image sélectionnée:', selectedImage.uri);

      // Vérifier que l'URI existe
      if (!selectedImage.uri) {
        console.log('URI de l\'image manquant');
        return;
      }

      // Télécharger l'image
      setUploading(true);
      await uploadImage(selectedImage.uri);
      
    } catch (error) {
      console.error('Erreur lors de la sélection de l\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    } finally {
      setUploading(false);
    }
  };

  const takePhoto = async () => {
    try {
      console.log('1. Début de la prise de photo');
      
      // Vérifier les permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('2. Statut de la permission:', status);
      
      if (status !== 'granted') {
        Alert.alert('Permission nécessaire', 'Veuillez autoriser l\'accès à la caméra dans les paramètres de l\'application.');
        return;
      }

      // Ouvrir l'appareil photo
      console.log('3. Ouverture de l\'appareil photo');
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      console.log('4. Résultat de la prise de photo:', JSON.stringify(result, null, 2));

      // Vérifier le résultat
      if (result.canceled) {
        console.log('Prise de photo annulée par l\'utilisateur');
        return;
      }

      if (!result.assets || result.assets.length === 0) {
        console.log('Aucune photo prise');
        return;
      }

      const photo = result.assets[0];
      console.log('5. Photo prise:', photo.uri);

      // Vérifier que l'URI existe
      if (!photo.uri) {
        console.log('URI de la photo manquant');
        return;
      }

      // Télécharger la photo
      setUploading(true);
      await uploadImage(photo.uri);
      
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    } finally {
      setUploading(false);
    }
  };

  const cleanupOldFiles = async () => {
    try {
      if (!session?.user) return;

      // Lister tous les fichiers dans le dossier de l'utilisateur
      const { data: files, error: listError } = await supabase.storage
        .from('avatars')
        .list(session.user.id);

      if (listError) {
        console.error('Erreur lors de la liste des fichiers:', listError);
        return;
      }

      if (!files || files.length === 0) return;

      // Trier les fichiers par date de création (du plus récent au plus ancien)
      const sortedFiles = files.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Garder uniquement le fichier le plus récent
      const filesToDelete = sortedFiles.slice(1);

      // Supprimer les fichiers obsolètes
      for (const file of filesToDelete) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([`${session.user.id}/${file.name}`]);
        
        if (deleteError) {
          console.error(`Erreur lors de la suppression de ${file.name}:`, deleteError);
        }
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage des fichiers:', error);
    }
  };

  const checkImageUrl = async (url: string) => {
    try {
      console.log('Vérification de l\'URL:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.log('URL invalide, code:', response.status);
        return false;
      }
      // Vérifier que la réponse est bien une image
      const contentType = response.headers.get('content-type');
      if (!contentType?.startsWith('image/')) {
        console.log('URL ne pointe pas vers une image:', contentType);
        return false;
      }
      console.log('URL valide et pointe vers une image');
      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'URL:', error);
      return false;
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      if (!session?.user) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      const filePath = `${session.user.id}/avatar_${Date.now()}.jpg`;

      // Supprimer l'ancienne image si elle existe
      const { data: oldFiles } = await supabase.storage
        .from('avatars')
        .list(session.user.id);
      
      if (oldFiles && oldFiles.length > 0) {
        await supabase.storage
          .from('avatars')
          .remove(oldFiles.map(file => `${session.user.id}/${file.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error('Impossible de générer l\'URL');

      await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      setAvatarUrl(publicUrl);
      Alert.alert('Succès', 'Photo de profil mise à jour');
      
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo');
    }
  };

  const handleImageLoad = () => {
    console.log('Image chargée avec succès');
    setIsImageLoading(false);
  };

  const handleImageError = (e: any) => {
    console.error('Erreur de chargement de l\'image:', e.nativeEvent.error);
    console.log('URL qui a échoué:', avatarUrl);
    setIsImageLoading(false);
    
    if (avatarUrl && avatarUrl !== DEFAULT_AVATAR) {
      // Essayer de recharger l'image avec une URL différente
      const baseUrl = avatarUrl.split('?')[0];
      const newUrl = `${baseUrl}?t=${Date.now()}`;
      console.log('Tentative de rechargement avec URL modifiée:', newUrl);
      setAvatarUrl(newUrl);
    } else {
      setAvatarUrl(DEFAULT_AVATAR);
    }
  };

  async function updateProfile(newUsername?: string) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session.user.id,
        username: newUsername || username,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;

      // Mise à jour du state username si un nouveau nom est fourni
      if (newUsername) {
        setUsername(newUsername);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Erreur', error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function changePassword() {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert('Erreur', 'Veuillez remplir tous les champs');
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
        return;
      }

      setLoading(true);

      // Vérifier le mot de passe actuel
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: session?.user?.email || '',
        password: currentPassword,
      });

      if (signInError) {
        Alert.alert('Erreur', 'Mot de passe actuel incorrect');
        return;
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      Alert.alert('Succès', 'Mot de passe mis à jour avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/');
  }
  if (!session || !session.user) {
    return (
      <View style={styles.container}>
        <Text>No user is logged in</Text>
      </View>
    );
  }
  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
        {/* En-tête avec message de bienvenue */}
        <View style={styles.headerContainer}>
          <Text style={styles.welcomeText}>Bonjour {username || 'Utilisateur'} !</Text>
        </View>

        {/* Photo de profil avec option de modification */}
        <View style={styles.profileSection}>
          <TouchableOpacity 
            style={styles.profileWrapper} 
            onPress={pickImage}
            disabled={uploading}
          >
            {isImageLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="green" />
              </View>
            )}
            <Image 
              source={{ uri: avatarUrl || DEFAULT_AVATAR }} 
              style={[
                styles.profileImage,
                isImageLoading && styles.hiddenImage
              ]}
              onLoadStart={() => setIsImageLoading(true)}
              onLoad={() => setIsImageLoading(false)}
              onError={() => setAvatarUrl(DEFAULT_AVATAR)}
            />
            {!isImageLoading && (
              <View style={styles.editIconContainer}>
                <Ionicons name="camera" size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
          
          <View style={styles.photoButtonsContainer}>
            <Button 
              title="Choisir" 
              onPress={pickImage}
              buttonStyle={styles.photoButton}
              disabled={uploading}
              icon={<Ionicons name="images-outline" size={16} color="white" style={{ marginRight: 5 }} />}
            />
            <Button 
              title="Photo" 
              onPress={takePhoto}
              buttonStyle={styles.photoButton}
              disabled={uploading}
              icon={<Ionicons name="camera-outline" size={16} color="white" style={{ marginRight: 5 }} />}
            />
          </View>
        </View>

        {/* Carte d'informations utilisateur */}
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Informations personnelles</Card.Title>
          <Card.Divider />

          <Input 
            label="Email" 
            value={session?.user?.email || ''} 
            disabled 
            inputStyle={styles.inputText}
            leftIcon={<Ionicons name="mail-outline" size={20} color="green" />}
          />

          <Input 
            label="Nom d'utilisateur"
            placeholder="Entrez votre nom d'utilisateur" 
            value={username} 
            onChangeText={(text: string) => {
              setUsername(text);
              updateProfile(text);
            }}
            inputStyle={styles.inputText}
            leftIcon={<Ionicons name="person-outline" size={20} color="green" />}
          />

          {/* Bouton Modifier */}
          <Button 
            title={loading ? 'Mise à jour...' : 'Mettre à jour'} 
            onPress={() => updateProfile(username)} 
            disabled={loading} 
            buttonStyle={styles.updateButton}
            icon={<Ionicons name="save-outline" size={22} color="white" style={{ marginRight: 10 }} />}
          />
        </Card>

        {/* Carte de changement de mot de passe */}
        <Card containerStyle={styles.card}>
          <Card.Title style={styles.cardTitle}>Changer le mot de passe</Card.Title>
          <Card.Divider />

          <Input 
            label="Mot de passe actuel"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            inputStyle={styles.inputText}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="green" />}
          />

          <Input 
            label="Nouveau mot de passe"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            inputStyle={styles.inputText}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="green" />}
          />

          <Input 
            label="Confirmer le nouveau mot de passe"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            inputStyle={styles.inputText}
            leftIcon={<Ionicons name="lock-closed-outline" size={20} color="green" />}
          />

          <Button 
            title={loading ? 'Changement en cours...' : 'Changer le mot de passe'} 
            onPress={changePassword} 
            disabled={loading} 
            buttonStyle={styles.updateButton}
            icon={<Ionicons name="key-outline" size={22} color="white" style={{ marginRight: 10 }} />}
          />
        </Card>

        {/* Bouton Déconnexion */}
        <Button 
          title="Déconnexion" 
          onPress={signOut} 
          buttonStyle={styles.signOutButton} 
          icon={<Ionicons name="log-out-outline" size={22} color="white" style={{ marginRight: 10 }} />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    paddingVertical: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerText: {
    color: '#333',
    fontSize: 26,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
    fontWeight:'bold'
  },
  profileWrapper: {
    marginTop: -25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  inputText: {
    fontSize: 16,
    color: '#555',
  },
  updateButton: {
    backgroundColor: '#008000',
    borderRadius: 12,
    marginVertical: 10,
    paddingVertical: 12,
  },
  signOutButton: {
    backgroundColor: '#b82b2b',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 12,
    marginTop: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'green',
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 8,
  },
  photoButton: {
    backgroundColor: 'green',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 100,
  },
  loadingContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hiddenImage: {
    opacity: 0,
  },
});

export default Profile;
