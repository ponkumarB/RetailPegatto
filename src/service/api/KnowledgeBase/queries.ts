import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchKnowledgecategorylistwithpagination,
  fetchKnowledgecategorylistwithoutpaginaton,
  createKnowledgecategorycrud,
  updateKnowledgecategorycrud,
  deleteKnowledgecategorycrud,
  fetchKnowledgecategorycrud,
  fetchKnowledgearticlelistwithpagination,
  createKnowledgearticlecrud,
  updateKnowledgearticlecrud,
  deleteKnowledgearticlecrud,
  fetchKnowledgearticlecrud,
  fetchKnowledgearticlesearch,
  createKnowledgearticlefilter,
  fetchKnowledgearticlelistwithoutpaginaton
} from './api';

export const useKnowledgeCategoriesList = (page: number = 1, page_size: number = 10) => {
  return useQuery({
    queryKey: ['knowledgeCategories', page, page_size],
    queryFn: () => fetchKnowledgecategorylistwithpagination(page, page_size),
  });
};

export const useKnowledgeCategoriesAll = () => {
  return useQuery({
    queryKey: ['knowledgeCategoriesAll'],
    queryFn: () => fetchKnowledgecategorylistwithoutpaginaton(),
  });
};

export const useKnowledgeCategory = (id: string | number) => {
  return useQuery({
    queryKey: ['knowledgeCategory', id],
    queryFn: () => fetchKnowledgecategorycrud(id),
    enabled: !!id,
  });
};

export const useCreateKnowledgeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKnowledgecategorycrud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeCategories'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeCategoriesAll'] });
    },
  });
};

export const useUpdateKnowledgeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateKnowledgecategorycrud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeCategories'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeCategoriesAll'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeCategory'] });
    },
  });
};

export const useDeleteKnowledgeCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKnowledgecategorycrud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeCategories'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeCategoriesAll'] });
    },
  });
};

export const useKnowledgeArticlesList = (page: number = 1, page_size: number = 10) => {
  return useQuery({
    queryKey: ['knowledgeArticles', page, page_size],
    queryFn: () => fetchKnowledgearticlelistwithpagination(page, page_size),
  });
};

export const useKnowledgeArticlesAll = () => {
  return useQuery({
    queryKey: ['knowledgeArticlesAll'],
    queryFn: () => fetchKnowledgearticlelistwithoutpaginaton(),
  });
};

export const useKnowledgeArticlesSearch = (searchQuery: string) => {
  return useQuery({
    queryKey: ['knowledgeArticlesSearch', searchQuery],
    queryFn: () => fetchKnowledgearticlesearch(searchQuery),
    enabled: !!searchQuery,
  });
};

export const useKnowledgeArticlesFilter = (payload: any) => {
  return useQuery({
    queryKey: ['knowledgeArticlesFilter', payload],
    queryFn: () => createKnowledgearticlefilter(payload),
    enabled: !!payload && Object.keys(payload).length > 0,
  });
};

export const useCreateKnowledgeArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKnowledgearticlecrud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesAll'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesSearch'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesFilter'] });
    },
  });
};

export const useUpdateKnowledgeArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateKnowledgearticlecrud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesAll'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesSearch'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesFilter'] });
    },
  });
};

export const useDeleteKnowledgeArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteKnowledgearticlecrud,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticles'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesAll'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesSearch'] });
      queryClient.invalidateQueries({ queryKey: ['knowledgeArticlesFilter'] });
    },
  });
};
