// src/screens/profile/EditProfileScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Input, Button, Card } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { COLORS, FONTS } from '../../constants';

interface FormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
}

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    bio: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});

  // Detectar mudanças no formulário
  useEffect(() => {
    const changed = 
      formData.name !== (user?.name || '') ||
      formData.email !== (user?.email || '') ||
      formData.phone !== '' ||
      formData.bio !== '';
    
    setHasChanges(changed);
  }, [formData, user]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar telefone (opcional)
    if (formData.phone.trim()) {
      const phoneRegex = /^\(?[1-9]{2}\)?\s?9?\d{4}-?\d{4}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Telefone inválido. Use formato: (11) 99999-9999';
      }
    }

    // Validar bio (opcional)
    if (formData.bio.trim() && formData.bio.trim().length > 200) {
      newErrors.bio = 'Bio deve ter no máximo 200 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo ao digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Formatar telefone automaticamente
    let formatted = value.replace(/\D/g, '');
    
    if (formatted.length <= 11) {
      if (formatted.length > 2) {
        formatted = `(${formatted.slice(0, 2)}) ${formatted.slice(2)}`;
      }
      if (formatted.length > 10) {
        formatted = formatted.replace(/(\d{5})(\d{4})/, '$1-$2');
      }
      handleChange('phone', formatted);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Erro', 'Por favor, corrija os erros no formulário');
      return;
    }

    Alert.alert(
      'Salvar Alterações',
      'Deseja salvar as alterações feitas no seu perfil?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: async () => {
            setLoading(true);
            try {
              await updateProfile({
                name: formData.name.trim(),
                email: formData.email.trim(),
              });

              Alert.alert(
                'Sucesso',
                'Perfil atualizado com sucesso!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                'Erro',
                error.message || 'Não foi possível atualizar o perfil'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    if (hasChanges) {
      Alert.alert(
        'Descartar Alterações',
        'Você tem alterações não salvas. Deseja descartá-las?',
        [
          { text: 'Continuar Editando', style: 'cancel' },
          {
            text: 'Descartar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      'Alterar Foto',
      'Escolha uma opção:',
      [
        {
          text: 'Câmera',
          onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
        },
        {
          text: 'Galeria',
          onPress: () => Alert.alert('Em breve', 'Funcionalidade em desenvolvimento'),
        },
        {
          text: 'Remover Foto',
          style: 'destructive',
          onPress: () => Alert.alert('Foto removida', 'Sua foto foi removida'),
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCancel}
            disabled={loading}
          >
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSave}
            disabled={loading || !hasChanges}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Ionicons
                name="checkmark"
                size={24}
                color={hasChanges ? COLORS.white : COLORS.white + '50'}
              />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <Card style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleChangeAvatar}
              disabled={loading}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {formData.name.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
              <View style={styles.avatarEditButton}>
                <Ionicons name="camera" size={16} color={COLORS.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
          </Card>

          {/* Form Section */}
          <Card style={styles.formSection}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome Completo *</Text>
              <Input
                placeholder="Digite seu nome"
                value={formData.name}
                onChangeText={(value) => handleChange('name', value)}
                error={errors.name}
                leftIcon="person-outline"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email *</Text>
              <Input
                placeholder="seu@email.com"
                value={formData.email}
                onChangeText={(value) => handleChange('email', value)}
                error={errors.email}
                leftIcon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              <Text style={styles.inputHint}>
                Você receberá um email de confirmação se alterar o endereço
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Telefone</Text>
              <Input
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChangeText={handlePhoneChange}
                error={errors.phone}
                leftIcon="call-outline"
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <Input
                placeholder="Conte um pouco sobre você..."
                value={formData.bio}
                onChangeText={(value) => handleChange('bio', value)}
                error={errors.bio}
                multiline
                numberOfLines={4}
                maxLength={200}
                editable={!loading}
                style={styles.bioInput}
              />
              <Text style={styles.characterCount}>
                {formData.bio.length}/200 caracteres
              </Text>
            </View>
          </Card>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Button
              title="Salvar Alterações"
              onPress={handleSave}
              disabled={loading || !hasChanges}
              loading={loading}
              style={styles.saveButton}
            />

            <Button
              title="Cancelar"
              onPress={handleCancel}
              variant="outline"
              disabled={loading}
              style={styles.cancelButton}
            />
          </View>

          {/* Info Section */}
          <Card style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.info} />
              <Text style={styles.infoText}>
                Seus dados pessoais são protegidos e nunca serão compartilhados sem sua permissão.
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.success} />
              <Text style={styles.infoText}>
                Todas as alterações são criptografadas e armazenadas com segurança.
              </Text>
            </View>
          </Card>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  avatarSection: {
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 48,
    fontFamily: FONTS.bold,
    color: COLORS.white,
  },
  avatarEditButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  avatarHint: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
  },
  formSection: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: COLORS.gray900,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    color: COLORS.gray700,
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    marginTop: 6,
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    color: COLORS.gray500,
    textAlign: 'right',
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: 16,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    marginBottom: 0,
  },
  infoSection: {
    padding: 16,
    backgroundColor: COLORS.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.info,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: COLORS.gray700,
    lineHeight: 18,
  },
});

export default EditProfileScreen;