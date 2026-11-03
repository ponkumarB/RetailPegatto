// services/RTKApis/SalesOrder/SalesOrderAPI.js
import { crmBaseApi } from "app/services/crmBaseApi"; // ✅ FIXED PATH

export const salesOrderApi = crmBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSalesOrders: builder.query({
      query: ({ page = 1, isDeleted = false }) => {
        const isDeletedValue = isDeleted ? 'True' : 'False';
        return `/user/UserSalesNewAdditional/?Is_Deleted=${isDeletedValue}&page=${page}`;
      },
      providesTags: (result) =>
        result?.results
          ? [
            ...result.results.map(({ id }) => ({ type: 'SalesOrder', id })),
            { type: 'SalesOrder', id: 'LIST' },
          ]
          : [{ type: 'SalesOrder', id: 'LIST' }],
      transformResponse: (response) => ({
        results: response?.results || [],
        count: response?.count || 0,
      }),
    }),

    createSalesOrder: builder.mutation({
      query: (payload) => ({
        url: '/user/UserSalesCRUD/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'SalesOrder', id: 'LIST' }],
    }),

    updateSalesOrder: builder.mutation({
      query: (payload) => ({
        url: '/user/UserSalesCRUD/',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SalesOrder', id },
        { type: 'SalesOrder', id: 'LIST' },
      ],
    }),

    deleteSalesOrder: builder.mutation({
      query: (id) => ({
        url: `/user/UserSalesCRUD/?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'SalesOrder', id: 'LIST' }],
    }),

    searchSalesOrders: builder.query({
      query: (searchTerm) => `/user/UserSalesSearch/?search=${searchTerm}`,
      providesTags: [{ type: 'SalesOrder', id: 'SEARCH' }],
    }),

    filterSalesOrders: builder.mutation({
      query: (filterData) => ({
        url: '/user/UserSalesFilter/',
        method: 'POST',
        body: filterData,
      }),
      invalidatesTags: [{ type: 'SalesOrder', id: 'LIST' }],
    }),

    getSalesOrderListsWithoutPage: builder.query({
      query: () => `/user/UserSalesList/`,
      providesTags: ['UserSales'],
      transformResponse: (response) => response || [],
    }),

    getPriceBooks: builder.query({
      query: () => `/user/ProductManageList/`,
      providesTags: ['PriceBook'],
      transformResponse: (response) => response || [],
    }),

    getOffersDropdown: builder.query({
      query: () => `/user/ProductOfferList/`,
      providesTags: ['Offer'],
      transformResponse: (response) => response || [],
    }),

    getQuotations: builder.query({
      query: () => `/user/ProductOfferList/`,
      providesTags: ['Quotation'],
      transformResponse: (response) => response || [],
    }),

    getAccounts: builder.query({
      query: () => `/user/AccountFullList/?Is_Deleted=False`,
      providesTags: ['Account'],
      transformResponse: (response) => response || [],
    }),

    updateOfferStatus: builder.mutation({
      query: (payload) => ({
        url: '/user/ProductOfferCRUD/',
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Offer', id },
        { type: 'Offer', id: 'LIST' },
      ],
    }),

    getTransactionSeries: builder.query({
      query: (doctype) => `/user/SeriesValue/?doctype=${doctype}`,
      providesTags: ['Series'],
    }),
  }),
});

export const {
  useGetSalesOrdersQuery,
  useCreateSalesOrderMutation,
  useUpdateSalesOrderMutation,
  useDeleteSalesOrderMutation,
  useSearchSalesOrdersQuery,
  useFilterSalesOrdersMutation,
  useGetSalesOrderListsWithoutPageQuery,
  useGetPriceBooksQuery,
  useGetOffersDropdownQuery,
  useGetQuotationsQuery,
  useGetAccountsQuery,
  useUpdateOfferStatusMutation,
  useGetTransactionSeriesQuery,
  useLazySearchSalesOrdersQuery,
} = salesOrderApi;