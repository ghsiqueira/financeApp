// src/screens/CategoriesScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useCategorias, Categoria, CORES_CATEGORIAS, ICONES_CATEGORIAS } from '../utils/categoryManager'
import { useTheme } from '../context/ThemeContext'

const CategoriesScreen = () => {
  const { theme } = useTheme()
  const {
    categorias,
    isLoading,
    criarCategoria,
    atualizarCategoria,
    excluirCategoria,
    refetch,
    importarCategoriasPadrao
  } = useCategorias()

  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'receita' | 'despesa'>('todos')
  const [searchTerm, setSearchTerm] = useState('')

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'despesa' as 'receita' | 'despesa',
    icone: 'home',
    cor: '#FF5722'
  })

  const styles = createStyles(theme)

  useEffect(() => {
    if (categorias.length === 0) {
      verificarCategoriasPadrao()
    }
  }, [])

  const verificarCategoriasPadrao = async () => {
    Alert.alert(
      'Categorias Padrão',
      'Deseja criar as categorias padrão? Isso incluirá categorias comuns como Alimentação, Transporte, etc.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Criar', 
          onPress: async () => {
            try {
              await importarCategoriasPadrao()
              await refetch()
              Alert.alert('Sucesso', 'Categorias padrão criadas com sucesso!')
            } catch (error) {
              Alert.alert('Erro', 'Erro ao criar categorias padrão')
            }
          }
        }
      ]
    )
  }

  const filtrarCategorias = () => {
    let categoriasFiltradas = categorias

    if (filtroTipo !== 'todos') {
      categoriasFiltradas = categoriasFiltradas.filter((cat: Categoria) => cat.tipo === filtroTipo)
    }

    if (searchTerm) {
      categoriasFiltradas = categoriasFiltradas.filter((cat: Categoria) =>
        cat.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return categoriasFiltradas.sort((a: Categoria, b: Categoria) => (a.ordem || 0) - (b.ordem || 0))
  }

  const abrirModal = (categoria?: Categoria) => {
    if (categoria) {
      setEditingCategory(categoria)
      setFormData({
        nome: categoria.nome,
        tipo: categoria.tipo,
        icone: categoria.icone,
        cor: categoria.cor
      })
    } else {
      setEditingCategory(null)
      setFormData({
        nome: '',
        tipo: 'despesa',
        icone: 'home',
        cor: '#FF5722'
      })
    }
    setModalVisible(true)
  }

  const salvarCategoria = async () => {
    if (!formData.nome.trim()) {
      Alert.alert('Erro', 'Nome da categoria é obrigatório')
      return
    }

    try {
      if (editingCategory) {
        await atualizarCategoria(editingCategory._id!, formData)
        Alert.alert('Sucesso', 'Categoria atualizada com sucesso!')
      } else {
        await criarCategoria({ ...formData, ordem: categorias.length + 1, ativa: true, padrao: false })
        Alert.alert('Sucesso', 'Categoria criada com sucesso!')
      }
      
      setModalVisible(false)
      await refetch()
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao salvar categoria')
    }
  }

  const confirmarExclusao = (categoria: Categoria) => {
    if (categoria.padrao) {
      Alert.alert('Atenção', 'Não é possível excluir categorias padrão')
      return
    }

    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a categoria "${categoria.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              await excluirCategoria(categoria._id!)
              await refetch()
              Alert.alert('Sucesso', 'Categoria excluída com sucesso!')
            } catch (error: any) {
              Alert.alert('Erro', error.message || 'Erro ao excluir categoria')
            }
          }
        }
      ]
    )
  }

  const renderCategoria = ({ item }: { item: Categoria }) => (
    <View style={styles.categoriaItem}>
      <View style={styles.categoriaInfo}>
        <View style={[styles.iconContainer, { backgroundColor: item.cor }]}>
          <Ionicons name={item.icone as any} size={24} color="#FFF" />
        </View>
        <View style={styles.categoriaTexto}>
          <Text style={styles.categoriaNome}>{item.nome}</Text>
          <Text style={styles.categoriaTipo}>
            {item.tipo === 'receita' ? 'Receita' : 'Despesa'}
            {item.padrao && ' • Padrão'}
          </Text>
          {item.subcategorias && item.subcategorias.length > 0 && (
            <Text style={styles.subcategorias}>
              {item.subcategorias.length} subcategoria(s)
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.categoriaAcoes}>
        <TouchableOpacity
          style={styles.botaoAcao}
          onPress={() => abrirModal(item)}
        >
          <Ionicons name="create" size={20} color={theme.primary} />
        </TouchableOpacity>
        
        {!item.padrao && (
          <TouchableOpacity
            style={styles.botaoAcao}
            onPress={() => confirmarExclusao(item)}
          >
            <Ionicons name="trash" size={20} color={theme.error} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  const renderSeletorCor = () => (
    <View style={styles.seletorCores}>
      <Text style={styles.label}>Cor:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {CORES_CATEGORIAS.map(cor => (
          <TouchableOpacity
            key={cor}
            style={[
              styles.corItem,
              { backgroundColor: cor },
              formData.cor === cor && styles.corSelecionada
            ]}
            onPress={() => setFormData({ ...formData, cor })}
          />
        ))}
      </ScrollView>
    </View>
  )

  const renderSeletorIcone = () => (
    <View style={styles.seletorIcones}>
      <Text style={styles.label}>Ícone:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {ICONES_CATEGORIAS.map(icone => (
          <TouchableOpacity
            key={icone}
            style={[
              styles.iconeItem,
              formData.icone === icone && styles.iconeSelecionado
            ]}
            onPress={() => setFormData({ ...formData, icone })}
          >
            <Ionicons name={icone as any} size={24} color={theme.text} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.titulo}>Categorias</Text>
        <TouchableOpacity
          style={styles.botaoAdicionar}
          onPress={() => abrirModal()}
        >
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Busca */}
      <View style={styles.busca}>
        <Ionicons name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={styles.inputBusca}
          placeholder="Buscar categorias..."
          placeholderTextColor={theme.textSecondary}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Filtros */}
      <View style={styles.filtros}>
        {[
          { key: 'todos', label: 'Todas' },
          { key: 'receita', label: 'Receitas' },
          { key: 'despesa', label: 'Despesas' }
        ].map(filtro => (
          <TouchableOpacity
            key={filtro.key}
            style={[
              styles.filtroItem,
              filtroTipo === filtro.key && styles.filtroAtivo
            ]}
            onPress={() => setFiltroTipo(filtro.key as any)}
          >
            <Text style={[
              styles.filtroTexto,
              filtroTipo === filtro.key && styles.filtroTextoAtivo
            ]}>
              {filtro.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista de Categorias */}
      <FlatList
        data={filtrarCategorias()}
        keyExtractor={item => item._id!}
        renderItem={renderCategoria}
        style={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[theme.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.listaVazia}>
            <Ionicons name="folder-open" size={64} color={theme.textSecondary} />
            <Text style={styles.textoVazio}>Nenhuma categoria encontrada</Text>
            <TouchableOpacity
              style={styles.botaoVazio}
              onPress={verificarCategoriasPadrao}
            >
              <Text style={styles.textoBotaoVazio}>Criar Categorias Padrão</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de Criação/Edição */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.botaoCancelar}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitulo}>
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </Text>
            <TouchableOpacity onPress={salvarCategoria}>
              <Text style={styles.botaoSalvar}>Salvar</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalConteudo}>
            {/* Nome */}
            <View style={styles.campo}>
              <Text style={styles.label}>Nome:</Text>
              <TextInput
                style={styles.input}
                value={formData.nome}
                onChangeText={text => setFormData({ ...formData, nome: text })}
                placeholder="Ex: Alimentação"
                placeholderTextColor={theme.textSecondary}
              />
            </View>

            {/* Tipo */}
            <View style={styles.campo}>
              <Text style={styles.label}>Tipo:</Text>
              <View style={styles.seletorTipo}>
                {[
                  { key: 'receita', label: 'Receita' },
                  { key: 'despesa', label: 'Despesa' }
                ].map(tipo => (
                  <TouchableOpacity
                    key={tipo.key}
                    style={[
                      styles.tipoItem,
                      formData.tipo === tipo.key && styles.tipoAtivo
                    ]}
                    onPress={() => setFormData({ ...formData, tipo: tipo.key as any })}
                  >
                    <Text style={[
                      styles.tipoTexto,
                      formData.tipo === tipo.key && styles.tipoTextoAtivo
                    ]}>
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Preview */}
            <View style={styles.preview}>
              <Text style={styles.label}>Preview:</Text>
              <View style={styles.previewCategoria}>
                <View style={[styles.iconContainer, { backgroundColor: formData.cor }]}>
                  <Ionicons name={formData.icone as any} size={24} color="#FFF" />
                </View>
                <Text style={styles.previewNome}>
                  {formData.nome || 'Nome da categoria'}
                </Text>
              </View>
            </View>

            {renderSeletorCor()}
            {renderSeletorIcone()}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  )
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text
  },
  botaoAdicionar: {
    backgroundColor: theme.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12
  },
  inputBusca: {
    flex: 1,
    fontSize: 16,
    color: theme.text
  },
  filtros: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12
  },
  filtroItem: {
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border
  },
  filtroAtivo: {
    backgroundColor: theme.primary
  },
  filtroTexto: {
    fontSize: 14,
    color: theme.text
  },
  filtroTextoAtivo: {
    color: '#FFF'
  },
  lista: {
    flex: 1,
    paddingHorizontal: 20
  },
  categoriaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    marginBottom: 12,
    borderRadius: 12
  },
  categoriaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  categoriaTexto: {
    flex: 1
  },
  categoriaNome: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4
  },
  categoriaTipo: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 2
  },
  subcategorias: {
    fontSize: 12,
    color: theme.textSecondary
  },
  categoriaAcoes: {
    flexDirection: 'row',
    gap: 8
  },
  botaoAcao: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: theme.background
  },
  listaVazia: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  textoVazio: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 16,
    marginBottom: 24
  },
  botaoVazio: {
    backgroundColor: theme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  textoBotaoVazio: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600'
  },
  modal: {
    flex: 1,
    backgroundColor: theme.background
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border
  },
  botaoCancelar: {
    fontSize: 16,
    color: theme.textSecondary
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text
  },
  botaoSalvar: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600'
  },
  modalConteudo: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20
  },
  campo: {
    marginBottom: 24
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8
  },
  input: {
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.border
  },
  seletorTipo: {
    flexDirection: 'row',
    gap: 12
  },
  tipoItem: {
    flex: 1,
    backgroundColor: theme.card,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border
  },
  tipoAtivo: {
    backgroundColor: theme.primary,
    borderColor: theme.primary
  },
  tipoTexto: {
    fontSize: 16,
    color: theme.text
  },
  tipoTextoAtivo: {
    color: '#FFF'
  },
  preview: {
    marginBottom: 24
  },
  previewCategoria: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    padding: 16,
    borderRadius: 12
  },
  previewNome: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginLeft: 12
  },
  seletorCores: {
    marginBottom: 24
  },
  corItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  corSelecionada: {
    borderColor: theme.text
  },
  seletorIcones: {
    marginBottom: 24
  },
  iconeItem: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: theme.card,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  iconeSelecionado: {
    borderColor: theme.primary
  }
})

export default CategoriesScreen