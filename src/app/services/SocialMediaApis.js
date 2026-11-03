import { crmBaseApi } from "./crmBaseApi";

export const SocialMediaApis = crmBaseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* GET Social Media Campaigns */
    getSocialMediaCampaignList: builder.query({
      query: (page) => ({
        url: `/user/SocialMediaPromotionallAdditional/`,
        method: "GET",
        params: {
          Created_By: Number(localStorage.getItem("UserId")),
          page: page
        }
      }),
      providesTags: ["SocialMedia"],
    }),
    /* POST Social URL */
    postSocialUrl: builder.mutation({
      query: (payload) => ({
        url: `/user/SocialUrlPostAPIView/`,
        method: "POST",
        body: payload
      }),
      invalidatesTags: ["SocialMedia"]
    }),
    /* GET Social Media Promotions List */
    getSocialMediaPromotionList: builder.query({
      query: (params) => ({
        url: `/user/SocialMediaPromotionlist/`,
        method: "GET",
        params: params
      }),
      providesTags: ["SocialMedia"],
    })
  }),
  overrideExisting: true
});

export const {
  useGetSocialMediaCampaignListQuery,
  usePostSocialUrlMutation,
  useGetSocialMediaPromotionListQuery
} = SocialMediaApis;
