import { fetchFromApi } from '@/service/apiClient';
import { upsertLocalItem, getLocalData, saveLocalData, deleteLocalItem } from '@/utils/persistentStorage';

export interface BankOfferDetail {
  id?: number | string;
  Bank_Name: string;
  Card_Type: 'Credit' | 'Debit' | 'Both' | string;
  Discount_Type?: string;
  Min_Transaction_Amount?: number;
  Min_Transaction?: number;
  Max_Discount?: number;
  Discount_Percentage?: number;
  Terms?: string;
  Promo_Code?: string;
  Is_Active?: boolean;
}

export interface StoreItem {
  id: number | string;
  name?: string;
  Store_Name?: string;
  StoreName?: string;
  Store_Code?: string;
  Store_Type?: string;
  Address?: string;
  [key: string]: any;
}

export interface ProductItem {
  id: number | string;
  Product_Id?: number | string;
  name: string;
  Product_Name?: string;
  sku: string;
  SKU_Code?: string;
  Product_Code?: string;
  category: string;
  ProductCategry_Name?: string;
  productGroup?: string;
  ProductGroup_Name?: string;
  price: number;
  Price?: number | string;
  stock?: number;
  Opening_Balance?: number | string;
  uom?: string;
  UOM?: string;
  brand?: string;
  Brand?: string;
  image?: string;
  Product_Image?: string;
  [key: string]: any;
}

export interface OfferTypeOption {
  value: string;
  label: string;
}

export interface CustomerTypeOption {
  value: string;
  label: string;
}

export interface OfferItem {
  id: number | string;
  OffersMaster_Id?: number | string;
  Offer_Name: string;
  Offer_Code: string;
  Offer_Type: 'percentage' | 'fixed' | 'bogo' | 'shipping' | 'bank' | string;
  Description?: string;
  Offer_Value?: number;
  Discount_Type?: string;
  Discount_Value?: number;
  Max_Discount?: number | null;
  Min_Purchase?: number;
  Customer_Type?: 'all' | 'new' | 'existing' | string;
  Start_Date: string;
  End_Date: string;
  Status: 'Active' | 'Scheduled' | 'Expired' | 'Draft' | string;
  Usage_Count?: number;
  Usage_Limit?: number | null;
  Per_User_Limit?: number;
  Per_Customer_Limit?: number;
  Applicable_Products?: Array<any>;
  Item_Id?: Array<any>;
  Applicable_Categories?: Array<any>;
  Store_Id?: Array<any>;
  Bank_Offer_Id?: BankOfferDetail[] | any;
  Is_Active?: boolean;
  Created_By?: number;
  Updated_By?: number;
  Organization_Id?: number;
  Created_Date?: string;
  [key: string]: any;
}

export interface OfferAnalytics {
  total_offers: number;
  active_offers: number;
  scheduled_offers: number;
  expired_offers: number;
  draft_offers: number;
  total_redemptions: number;
  total_discount_value: number;
  active_conversion?: number;
  status_breakdown: {
    active: number;
    scheduled: number;
    expired: number;
    draft: number;
  };
  top_offers: Array<{
    id: number | string;
    Offer_Name: string;
    Offer_Code: string;
    Offer_Type: string;
    Usage_Count: number;
    Total_Discount: number;
    Total_Revenue?: number;
    conversion_rate?: number;
    Status: string;
  }>;
}

const STORAGE_KEY = 'pegatto_offers_master';

export const FALLBACK_OFFER_TYPES: OfferTypeOption[] = [
  { value: 'percentage', label: 'Percentage Discount' },
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'bogo', label: 'Buy One Get One' },
  { value: 'shipping', label: 'Free Shipping' },
  { value: 'bank', label: 'Bank Offer' }
];

export const FALLBACK_CUSTOMER_TYPES: CustomerTypeOption[] = [
  { value: 'all', label: 'All Customers' },
  { value: 'new', label: 'New Customers Only' },
  { value: 'existing', label: 'Existing Customers' },
  { value: 'vip', label: 'VIP / Loyalty Members' }
];

export const FALLBACK_BANKS = [
  { id: 1, Bank_Name: 'HDFC Bank', code: 'HDFC', name: 'HDFC Bank' },
  { id: 2, Bank_Name: 'ICICI Bank', code: 'ICICI', name: 'ICICI Bank' },
  { id: 3, Bank_Name: 'State Bank of India', code: 'SBI', name: 'State Bank of India' },
  { id: 4, Bank_Name: 'Axis Bank', code: 'AXIS', name: 'Axis Bank' },
  { id: 5, Bank_Name: 'Kotak Mahindra Bank', code: 'KOTAK', name: 'Kotak Mahindra Bank' },
  { id: 6, Bank_Name: 'Yes Bank', code: 'YES', name: 'Yes Bank' },
  { id: 7, Bank_Name: 'American Express', code: 'AMEX', name: 'American Express' }
];

const INITIAL_OFFERS: OfferItem[] = [
  {
    "id": 14,
    "OffersMaster_Id": "OFM000000014",
    "Offer_Name": "christmas",
    "Offer_Code": "C310",
    "Offer_Type": "bank",
    "Offer_Value": 10,
    "Discount_Type": "instant",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 0,
    "Max_Discount": null,
    "Usage_Limit": null,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-09-29",
    "End_Date": "2026-10-29",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "",
    "Bank_Offer_Id": [
      {
        "id": 10,
        "OfferBankDetails_Id": "OBD000000010",
        "Bank_Name": "Axis Bank",
        "Card_Type": "Debit",
        "Min_Transaction_Amount": 5000,
        "Is_Active": true,
        "Is_Deleted": false,
        "Created_Date": "2026-09-29T13:21:20.242048+05:30",
        "Updated_Date": "2026-09-29T13:21:20.242077+05:30",
        "Created_By": null,
        "Updated_By": null
      }
    ],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 13,
    "OffersMaster_Id": "OFM000000013",
    "Offer_Name": "holi offer",
    "Offer_Code": "H734",
    "Offer_Type": "percentage",
    "Offer_Value": 10,
    "Discount_Type": "percentage",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 0,
    "Max_Discount": null,
    "Usage_Limit": null,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-09-29",
    "End_Date": "2026-10-29",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 12,
    "OffersMaster_Id": "OFM000000012",
    "Offer_Name": "Bigbillion",
    "Offer_Code": "BIGBILLI552",
    "Offer_Type": "percentage",
    "Offer_Value": 10,
    "Discount_Type": "Percentage",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 100008,
    "Max_Discount": null,
    "Usage_Limit": null,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-09-29",
    "End_Date": "2026-10-29",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 11,
    "OffersMaster_Id": "OFM000000011",
    "Offer_Name": "Big Billion Days",
    "Offer_Code": "B864",
    "Offer_Type": "percentage",
    "Offer_Value": 10,
    "Discount_Type": "percentage",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 5000,
    "Max_Discount": null,
    "Usage_Limit": null,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-09-29",
    "End_Date": "2026-10-31",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 10,
    "OffersMaster_Id": "OFM000000010",
    "Offer_Name": "Pongal Offer",
    "Offer_Code": "P254",
    "Offer_Type": "fixed",
    "Offer_Value": 1000,
    "Discount_Type": "fixed",
    "Discount_Value": 1000,
    "Is_Active": false,
    "Min_Purchase": 5000,
    "Max_Discount": null,
    "Usage_Limit": null,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-09-29",
    "End_Date": "2026-11-04",
    "Status": "Draft",
    "Customer_Type": "new",
    "Applicable_Products": [
      40
    ],
    "Applicable_Categories": [],
    "Description": "",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 9,
    "OffersMaster_Id": "OFM000000009",
    "Offer_Name": "Diwali",
    "Offer_Code": "DIWALI501",
    "Offer_Type": "percentage",
    "Offer_Value": 10,
    "Discount_Type": "Percentage",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 17,
    "Max_Discount": -15,
    "Usage_Limit": null,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-09-29",
    "End_Date": "2026-10-29",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "10%",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 8,
    "OffersMaster_Id": "OFM000000008",
    "Offer_Name": "Test",
    "Offer_Code": "TEST930",
    "Offer_Type": "percentage",
    "Offer_Value": 10,
    "Discount_Type": "Percentage",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 1,
    "Max_Discount": 1,
    "Usage_Limit": null,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-06-15",
    "End_Date": "2026-07-15",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "test",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 7,
    "OffersMaster_Id": "OFM000000007",
    "Offer_Name": "Winter Sale",
    "Offer_Code": "WINTERSA53",
    "Offer_Type": "bank",
    "Offer_Value": 3,
    "Discount_Type": "Percentage",
    "Discount_Value": 3,
    "Is_Active": true,
    "Min_Purchase": 0,
    "Max_Discount": null,
    "Usage_Limit": 23,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-04-13",
    "End_Date": "2026-05-13",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [
      {
        "id": 21,
        "sku": "BPL-006",
        "uom": "Unit",
        "name": "Batching Plants",
        "brand": "Apollo",
        "image": "/media/download_5_k48eNa1_TummsOx.jfif",
        "price": 1500000,
        "stock": 1,
        "category": "Construction Machinery & Equipment",
        "Product_Id": "SP1000724-25",
        "productGroup": "Concrete Equipment"
      }
    ],
    "Applicable_Categories": [
      {
        "id": 1,
        "name": "Construction Machinery & Equipment",
        "count": 6
      }
    ],
    "Description": "test",
    "Bank_Offer_Id": [
      {
        "id": 9,
        "OfferBankDetails_Id": "OBD000000009",
        "Bank_Name": "HDFC",
        "Card_Type": "Debit",
        "Min_Transaction_Amount": 0,
        "Is_Active": true,
        "Is_Deleted": false,
        "Created_Date": "2026-04-13T17:31:36.767231+05:30",
        "Updated_Date": "2026-04-13T17:31:36.767249+05:30",
        "Created_By": null,
        "Updated_By": null
      }
    ],
    "Store_Id": [
      {
        "id": 6,
        "Store_Id": "STM-000035",
        "Store_Name": "Civicon Construction Market",
        "Store_Items": [
          {
            "id": 20,
            "UOM": "Unit",
            "Bar_Code": "",
            "Product_Id": "SP1000624-25",
            "Product_Code": "",
            "Product_Name": "Concrete Mixers",
            "Product_Image": "",
            "Reorder_Level": 2,
            "Min_Stock_Level": 3,
            "Opening_Balance": 10,
            "Product_Category": ""
          },
          {
            "id": 21,
            "UOM": "Unit",
            "Bar_Code": "",
            "Product_Id": "SP1000724-25",
            "Product_Code": "",
            "Product_Name": "Batching Plants",
            "Product_Image": "",
            "Reorder_Level": 2,
            "Min_Stock_Level": 1,
            "Opening_Balance": 5,
            "Product_Category": ""
          },
          {
            "id": 19,
            "UOM": "Unit",
            "Bar_Code": "",
            "Product_Id": "SP1000524-25",
            "Product_Code": "",
            "Product_Name": "Forklifts",
            "Product_Image": "",
            "Reorder_Level": 2,
            "Min_Stock_Level": 1,
            "Opening_Balance": 15,
            "Product_Category": ""
          },
          {
            "id": 16,
            "UOM": "Unit",
            "Bar_Code": "",
            "Product_Id": "SP1000224-25",
            "Product_Code": "",
            "Product_Name": "Excavators",
            "Product_Image": "",
            "Reorder_Level": 2,
            "Min_Stock_Level": 1,
            "Opening_Balance": 10,
            "Product_Category": ""
          },
          {
            "id": 17,
            "UOM": "Unit",
            "Bar_Code": "",
            "Product_Id": "SP1000324-25",
            "Product_Code": "",
            "Product_Name": "Backhoes",
            "Product_Image": "",
            "Reorder_Level": 2,
            "Min_Stock_Level": 1,
            "Opening_Balance": 10,
            "Product_Category": ""
          },
          {
            "id": 18,
            "UOM": "Unit",
            "Bar_Code": "",
            "Product_Id": "SP1000424-25",
            "Product_Code": "",
            "Product_Name": "Cranes",
            "Product_Image": "",
            "Reorder_Level": 2,
            "Min_Stock_Level": 1,
            "Opening_Balance": 10,
            "Product_Category": ""
          },
          {
            "id": 74,
            "UOM": "kg",
            "Bar_Code": "",
            "Product_Id": "SPM100262459",
            "Product_Code": "",
            "Product_Name": "Tomato",
            "Product_Image": "/media/tomato.webp",
            "Reorder_Level": 10,
            "Min_Stock_Level": 12,
            "Opening_Balance": 20,
            "Product_Category": ""
          },
          {
            "id": 75,
            "UOM": "ltr",
            "Bar_Code": "",
            "Product_Id": "SPM100262460",
            "Product_Code": "",
            "Product_Name": "Sunflower Oil",
            "Product_Image": "/media/sunflower_oil.webp",
            "Reorder_Level": 12,
            "Min_Stock_Level": 12,
            "Opening_Balance": 45,
            "Product_Category": ""
          },
          {
            "id": 81,
            "UOM": "pcs",
            "Bar_Code": "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",
            "Product_Id": "SPM100262463",
            "Product_Code": "29790001",
            "Product_Name": "Electronic Chip",
            "Product_Image": "/media/Chip_jiYOsxe.avif",
            "Reorder_Level": 10,
            "Min_Stock_Level": 12,
            "Opening_Balance": 67,
            "Product_Category": ""
          },
          {
            "id": 76,
            "UOM": "ltr",
            "Bar_Code": "iVBORw0KGgoAAAANSUhEUgAAAKUAAABmCAIAAAAlNcaXAAAEC0lEQVR4nO3dTyj7fwDH8fdHXzGb5EBkByvNhfmTkqOL2UGiHFZ2onaQqE3ttkkIobiIkpssNbVlN3+2i4NcFFEaJUnLUtuSmO9BrU/brO+33++zb/Z6PW57v9977/3x7LPaUpM+Pz8FwSj41wegnGJvLOyNhb2xsDcW9sbC3ljYGwt7Y2FvLL/+arUkSfKHX9/Ffg2mfC+bslK+PmVNclD+lP++W8anyw/83T5ZdvvzK03Z+c9fMeMOWf5Q3+32Hd7fWNgbC3tjYW8s7I2FvbGwNxb2xsLeWNgbC3tjYW8s7I2FvbGwNxb2xsLeWNgbC3tjYW8s7I2FvbGwNxb2xsLeWNgbC3tjYW8s7I2FvbGwNxb2xsLeWNgbC3tjYW8s7I2FvbGwNxb2xsLeWNgbC3tjYW8s7I2FvbGwNxb2xiLx90Oh8P7Gwt5Y2BsLe2NhbyzsjSUfep+cnFit1rKyMkmSbm9v5VN3d3ejo6N6vV6tVjc0NKysrHx8fCRnn5+fZ2ZmDAaDWq2ur6+fnJyMx+Pp+7+/vzc3N0uStLe3p/ClKO/zhwuHw+3t7Wtray6XSwgRCoXks0ajsaWlJRAIRKNRr9erVqutVmty1uVyTU9PX1xcxGKxo6OjysrK3t7e9JeYn58vLy8XQng8HmUvRnk/vnfS8vJyeu+FhYV4PJ58ODY2VlBQEA6HM+7gdDqFEE9PT/LBUCik0WgWFxfzo3c+vJ9nYbfbVSpV8qFWq00kEg8PDxkXZ/xFx5GRkYGBgdbWVqWOmFt/9/uhP10gECgqKtLpdCnjr6+vwWBwdXXVYrFUVFQkx91udyAQuL6+vrq6yu1JlZLn97dcMBj0+XzDw8MajUY+XlVVpVKpurq6uru7Nzc3k+MvLy/j4+MOh6O6ujrnh1UKSu9wOGyxWOrq6mZnZ1OmHh8fY7HY/v7+wcGB2WxOjjscjsLCQpvNltuTKgui99vbW39/fzQa9fl8paWl6QtKSkpMJtPS0tLu7u7x8bEQ4ubmZn19fW5urri4OOfnVRBE76GhodPTU6/Xq9frsyxrbGwUQlxeXgohIpFIIpEwm82SJEmS1NnZKYTo6+urra3NyZGVkv+9nU7n9vb2zs5OR0dH9pXn5+dCCK1WK4Roa2uTf4w5PDwUQng8npTvc36cPO+9tbU1NTW1sbHR09OTPmsymdxu9/39fTQa9fv9drvdYDAYjcbcnzN3/tUH//9RTU1NykXZbLavqaampvRL9vv9X7NnZ2eDg4M6nU6lUun1+omJiUgkkvElkvd3Ti5IQfx/Jix5/n5OKdgbC3tjYW8s7I2FvbGwNxb2xsLeWNgbC3tjYW8s7I2FvbGwNxb2xsLeWNgbC3tjYW8s7I2FvbH8BjBZRAk6nsnIAAAAAElFTkSuQmCC",
            "Product_Id": "SPM100262461",
            "Product_Code": "1234",
            "Product_Name": "Gold Winner Oil",
            "Product_Image": "/media/sunflower_oil.webp",
            "Reorder_Level": 5,
            "Min_Stock_Level": 8,
            "Opening_Balance": 80,
            "Product_Category": "Cooking Oil"
          }
        ],
        "Store_Inchange": "Prakash",
        "Building_Name": "Concrete Heights Plaza",
        "Country": "India",
        "State": "Tamil Nadu",
        "City": "Chennai",
        "Location": "Thoraipakkam",
        "Is_Deleted": false,
        "Created_Date": "2024-10-07T13:57:26.964212+05:30",
        "Updated_Date": "2024-10-07T13:57:26.964257+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 72
      }
    ],
    "Item_Id": [
      {
        "id": 69,
        "Product_Name": "Mac Laptop",
        "Product_Description": "Mac laptop- 14.5 inch",
        "Product_Code": "HAK0001",
        "Bar_Code": null,
        "HSN_Code": "989085574",
        "SKU_Code": "LAP-TOP-007005",
        "UOM": "kg",
        "Brand": "Mac",
        "Price": "89999",
        "Tax": "Customs Duty",
        "Tax_Flag": true,
        "Is_Batch": false,
        "Product_Image": "https://backend.crmfarm.app/media/Laptop.jpg",
        "ProductGroup_id": "59",
        "ProductGroup_Name": "Grp  10",
        "ProductCategry_Name": "Home and Kitchen",
        "Opening_Balance": "1",
        "Opening_Price": "1",
        "Refund_Applicable": null,
        "Within_Hours": 0,
        "Variant": null,
        "Product_Id": "SPM100262454",
        "Is_Deleted": false,
        "Created_Date": "2026-02-06T13:30:15.299767+05:30",
        "Updated_Date": "2026-02-06T13:30:15.299767+05:30",
        "Organization_Id": 1,
        "Created_By": 72,
        "Updated_By": 72
      }
    ]
  },
  {
    "id": 6,
    "OffersMaster_Id": "OFM000000006",
    "Offer_Name": "Summer Offer",
    "Offer_Code": "SUMMEROF341",
    "Offer_Type": "percentage",
    "Offer_Value": 12,
    "Discount_Type": "Percentage",
    "Discount_Value": 12,
    "Is_Active": true,
    "Min_Purchase": 0,
    "Max_Discount": null,
    "Usage_Limit": 20,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-04-13",
    "End_Date": "2026-05-13",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [
      {
        "id": 24,
        "sku": "Wire2024",
        "uom": "mtr",
        "name": "Wire",
        "brand": "polycab",
        "image": "/media/bug_po_38_oPcM4ej.png",
        "price": 5000,
        "stock": 1000,
        "category": "Electricals",
        "Product_Id": "SP1001024-25",
        "productGroup": "Raw materials"
      },
      {
        "id": 18,
        "sku": "CRN-003",
        "uom": "Unit",
        "name": "Cranes",
        "brand": "Tata Hitachi",
        "image": "/media/download_2_CHhiyED.jfif",
        "price": 8000000,
        "stock": 5,
        "category": "Construction Machinery & Equipment",
        "Product_Id": "SP1000424-25",
        "productGroup": "Lifting Equipment"
      },
      {
        "id": 19,
        "sku": "FLK-004",
        "uom": "Unit",
        "name": "Forklifts",
        "brand": "Godrej",
        "image": "/media/download_3_Mgf1JhG.jfif",
        "price": 1200000,
        "stock": 5,
        "category": "Construction Machinery & Equipment",
        "Product_Id": "SP1000524-25",
        "productGroup": "Lifting Equipment"
      },
      {
        "id": 17,
        "sku": "BCK-002",
        "uom": "Unit",
        "name": "Backhoes",
        "brand": "JCB",
        "image": "/media/download_1_HFoTsoE.jfif",
        "price": 2800000,
        "stock": 5,
        "category": "Construction Machinery & Equipment",
        "Product_Id": "SP1000324-25",
        "productGroup": "Excavation Equipment"
      }
    ],
    "Applicable_Categories": [
      {
        "id": 2,
        "name": "Electricals",
        "count": 1
      },
      {
        "id": 1,
        "name": "Construction Machinery & Equipment",
        "count": 6
      }
    ],
    "Description": "test",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 5,
    "OffersMaster_Id": "OFM000000005",
    "Offer_Name": "Festival Offer",
    "Offer_Code": "FEEEEST2025",
    "Offer_Type": "percentage",
    "Offer_Value": 10,
    "Discount_Type": "Percentage",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 1000,
    "Max_Discount": 500,
    "Usage_Limit": 100,
    "Per_User_Limit": 2,
    "Usage_Count": 0,
    "Start_Date": "2026-04-01",
    "End_Date": "2026-04-30",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "Festival special discount",
    "Bank_Offer_Id": [
      {
        "id": 2,
        "OfferBankDetails_Id": "OBD000000002",
        "Bank_Name": "SBI",
        "Card_Type": "Credit",
        "Min_Transaction_Amount": 2000,
        "Is_Active": true,
        "Is_Deleted": false,
        "Created_Date": "2026-04-01T15:17:40.996870+05:30",
        "Updated_Date": "2026-04-01T15:17:40.996870+05:30",
        "Created_By": 1,
        "Updated_By": 1
      },
      {
        "id": 3,
        "OfferBankDetails_Id": "OBD000000003",
        "Bank_Name": "AXIS",
        "Card_Type": "Credit",
        "Min_Transaction_Amount": 2000,
        "Is_Active": true,
        "Is_Deleted": false,
        "Created_Date": "2026-04-01T15:17:49.782502+05:30",
        "Updated_Date": "2026-04-01T15:17:49.782502+05:30",
        "Created_By": 1,
        "Updated_By": 1
      }
    ],
    "Store_Id": [
      {
        "id": 1,
        "Store_Id": "STR000000001",
        "Store_Name": "bangalore hub",
        "Store_Items": [
          {
            "id": 71,
            "UOM": "pcs",
            "Product_Id": "SPM100262456",
            "Product_Name": "Bulb",
            "Product_Image": "/media/Bulb.jpg",
            "Reorder_Level": 10,
            "Min_Stock_Level": 10,
            "Opening_Balance": 5000
          },
          {
            "id": 69,
            "UOM": "kg",
            "Product_Id": "SPM100262454",
            "Product_Name": "Mac Laptop",
            "Product_Image": "/media/Laptop.jpg",
            "Reorder_Level": 10,
            "Min_Stock_Level": 10,
            "Opening_Balance": 5000
          },
          {
            "id": 70,
            "UOM": "pcs",
            "Product_Id": "SPM100262455",
            "Product_Name": "Knife",
            "Product_Image": "/media/1_807bcd15-c754-4efa-9b90-c6111d24a01e.webp",
            "Reorder_Level": 10,
            "Min_Stock_Level": 5,
            "Opening_Balance": 1000
          }
        ],
        "Store_Inchange": "Ravi Kumar",
        "Building_Name": "12A Greeta Tower",
        "Country": "India",
        "State": "Tamil nadu",
        "City": "CHennai",
        "Location": "Anna nagar",
        "Is_Deleted": false,
        "Created_Date": "2024-07-18T11:21:14.045309+05:30",
        "Updated_Date": "2024-07-18T11:21:14.045339+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 72
      },
      {
        "id": 2,
        "Store_Id": "STM-000031",
        "Store_Name": "Greeta Store",
        "Store_Items": [
          {
            "id": 35,
            "UOM": "mtr",
            "Category": "",
            "Item_Code": "SP1002024-25",
            "Item_Name": "Rice",
            "Item_Group": "",
            "Unit_Price": 0,
            "ReOrder_Lvl": 10,
            "Min_Stock_Lvl": 5,
            "Opening_Stock": 80
          }
        ],
        "Store_Inchange": "Vijay",
        "Building_Name": "Greeta Towers",
        "Country": "India",
        "State": "Tamil Nadu",
        "City": "Chennai",
        "Location": "ThoraiPakkam",
        "Is_Deleted": true,
        "Created_Date": "2024-07-24T19:32:48.907124+05:30",
        "Updated_Date": "2024-07-24T19:32:48.907194+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 4
      }
    ],
    "Item_Id": [
      {
        "id": 70,
        "Product_Name": "Knife",
        "Product_Description": "Knife is used for cut the vegitables.",
        "Product_Code": "HAK0002",
        "Bar_Code": null,
        "HSN_Code": "",
        "SKU_Code": "KF0001",
        "UOM": "pcs",
        "Brand": "",
        "Price": "20",
        "Tax": "",
        "Tax_Flag": false,
        "Is_Batch": false,
        "Product_Image": "https://backend.crmfarm.app/media/1_807bcd15-c754-4efa-9b90-c6111d24a01e.webp",
        "ProductGroup_id": "75",
        "ProductGroup_Name": "Home and Kitchen Products",
        "ProductCategry_Name": "Home and Kitchen",
        "Opening_Balance": "1",
        "Opening_Price": "10",
        "Refund_Applicable": null,
        "Within_Hours": 0,
        "Variant": null,
        "Product_Id": "SPM100262455",
        "Is_Deleted": false,
        "Created_Date": "2026-03-16T17:02:48.039323+05:30",
        "Updated_Date": "2026-03-16T17:02:48.039377+05:30",
        "Organization_Id": 1,
        "Created_By": 72,
        "Updated_By": 72
      }
    ]
  },
  {
    "id": 4,
    "OffersMaster_Id": "OFM000000004",
    "Offer_Name": "Pongal Offer",
    "Offer_Code": "PONG2027",
    "Offer_Type": "bank",
    "Offer_Value": 200,
    "Discount_Type": "Fixed",
    "Discount_Value": 200,
    "Is_Active": true,
    "Min_Purchase": 1000,
    "Max_Discount": 500,
    "Usage_Limit": 100,
    "Per_User_Limit": 1,
    "Usage_Count": 0,
    "Start_Date": "2026-04-01",
    "End_Date": "2026-04-30",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "Festival special discount",
    "Bank_Offer_Id": [
      {
        "id": 2,
        "OfferBankDetails_Id": "OBD000000002",
        "Bank_Name": "SBI",
        "Card_Type": "Credit",
        "Min_Transaction_Amount": 2000,
        "Is_Active": true,
        "Is_Deleted": false,
        "Created_Date": "2026-04-01T15:17:40.996870+05:30",
        "Updated_Date": "2026-04-01T15:17:40.996870+05:30",
        "Created_By": 1,
        "Updated_By": 1
      },
      {
        "id": 3,
        "OfferBankDetails_Id": "OBD000000003",
        "Bank_Name": "AXIS",
        "Card_Type": "Credit",
        "Min_Transaction_Amount": 2000,
        "Is_Active": true,
        "Is_Deleted": false,
        "Created_Date": "2026-04-01T15:17:49.782502+05:30",
        "Updated_Date": "2026-04-01T15:17:49.782502+05:30",
        "Created_By": 1,
        "Updated_By": 1
      }
    ],
    "Store_Id": [
      {
        "id": 1,
        "Store_Id": "STR000000001",
        "Store_Name": "bangalore hub",
        "Store_Items": [
          {
            "id": 71,
            "UOM": "pcs",
            "Product_Id": "SPM100262456",
            "Product_Name": "Bulb",
            "Product_Image": "/media/Bulb.jpg",
            "Reorder_Level": 10,
            "Min_Stock_Level": 10,
            "Opening_Balance": 5000
          },
          {
            "id": 69,
            "UOM": "kg",
            "Product_Id": "SPM100262454",
            "Product_Name": "Mac Laptop",
            "Product_Image": "/media/Laptop.jpg",
            "Reorder_Level": 10,
            "Min_Stock_Level": 10,
            "Opening_Balance": 5000
          },
          {
            "id": 70,
            "UOM": "pcs",
            "Product_Id": "SPM100262455",
            "Product_Name": "Knife",
            "Product_Image": "/media/1_807bcd15-c754-4efa-9b90-c6111d24a01e.webp",
            "Reorder_Level": 10,
            "Min_Stock_Level": 5,
            "Opening_Balance": 1000
          }
        ],
        "Store_Inchange": "Ravi Kumar",
        "Building_Name": "12A Greeta Tower",
        "Country": "India",
        "State": "Tamil nadu",
        "City": "CHennai",
        "Location": "Anna nagar",
        "Is_Deleted": false,
        "Created_Date": "2024-07-18T11:21:14.045309+05:30",
        "Updated_Date": "2024-07-18T11:21:14.045339+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 72
      },
      {
        "id": 2,
        "Store_Id": "STM-000031",
        "Store_Name": "Greeta Store",
        "Store_Items": [
          {
            "id": 35,
            "UOM": "mtr",
            "Category": "",
            "Item_Code": "SP1002024-25",
            "Item_Name": "Rice",
            "Item_Group": "",
            "Unit_Price": 0,
            "ReOrder_Lvl": 10,
            "Min_Stock_Lvl": 5,
            "Opening_Stock": 80
          }
        ],
        "Store_Inchange": "Vijay",
        "Building_Name": "Greeta Towers",
        "Country": "India",
        "State": "Tamil Nadu",
        "City": "Chennai",
        "Location": "ThoraiPakkam",
        "Is_Deleted": true,
        "Created_Date": "2024-07-24T19:32:48.907124+05:30",
        "Updated_Date": "2024-07-24T19:32:48.907194+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 4
      }
    ],
    "Item_Id": [
      {
        "id": 71,
        "Product_Name": "Bulb",
        "Product_Description": "bulb is a electronic item.",
        "Product_Code": "JJJ0001",
        "Bar_Code": "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",
        "HSN_Code": "",
        "SKU_Code": "",
        "UOM": "pcs",
        "Brand": "",
        "Price": "210",
        "Tax": "Goods and Services Tax (GST)",
        "Tax_Flag": true,
        "Is_Batch": false,
        "Product_Image": "https://backend.crmfarm.app/media/Bulb.jpg",
        "ProductGroup_id": "101",
        "ProductGroup_Name": "Bulb",
        "ProductCategry_Name": "Electronics",
        "Opening_Balance": "0",
        "Opening_Price": "0",
        "Refund_Applicable": null,
        "Within_Hours": 0,
        "Variant": null,
        "Product_Id": "SPM100262456",
        "Is_Deleted": false,
        "Created_Date": "2026-03-16T22:04:32.225461+05:30",
        "Updated_Date": "2026-03-16T22:04:32.225500+05:30",
        "Organization_Id": 1,
        "Created_By": 72,
        "Updated_By": 72
      }
    ]
  },
  {
    "id": 3,
    "OffersMaster_Id": "OFM000000003",
    "Offer_Name": "Festival Offer",
    "Offer_Code": "FEEST2025",
    "Offer_Type": "bank",
    "Offer_Value": 10,
    "Discount_Type": "Fixed",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 1000,
    "Max_Discount": 500,
    "Usage_Limit": 100,
    "Per_User_Limit": 2,
    "Usage_Count": 0,
    "Start_Date": "2026-04-01",
    "End_Date": "2026-04-30",
    "Status": "Active",
    "Customer_Type": "new",
    "Applicable_Products": [
      {
        "id": 69,
        "sku": "LAP-TOP-007005",
        "uom": "kg",
        "name": "Mac Laptop",
        "brand": "Mac",
        "image": "/media/Laptop.jpg",
        "price": 89999,
        "stock": 1,
        "category": "Home and Kitchen",
        "Product_Id": "SPM100262454",
        "Product_Name": "Mac Laptop",
        "productGroup": "Grp  10"
      }
    ],
    "Applicable_Categories": [
      {
        "id": 1,
        "name": "Home and Kitchen",
        "count": 2
      }
    ],
    "Description": "Festival special discount",
    "Bank_Offer_Id": [
      {
        "id": 2,
        "OfferBankDetails_Id": "OBD000000002",
        "Bank_Name": "SBI",
        "Card_Type": "Credit",
        "Min_Transaction_Amount": 2000,
        "Is_Active": true,
        "Is_Deleted": false,
        "Created_Date": "2026-04-01T15:17:40.996870+05:30",
        "Updated_Date": "2026-04-01T15:17:40.996870+05:30",
        "Created_By": 1,
        "Updated_By": 1
      }
    ],
    "Store_Id": [
      {
        "id": 1,
        "Store_Id": "STR000000001",
        "Store_Name": "bangalore hub",
        "Store_Items": [
          {
            "id": 71,
            "UOM": "pcs",
            "Product_Id": "SPM100262456",
            "Product_Name": "Bulb",
            "Product_Image": "/media/Bulb.jpg",
            "Reorder_Level": 10,
            "Min_Stock_Level": 10,
            "Opening_Balance": 5000
          },
          {
            "id": 69,
            "UOM": "kg",
            "Product_Id": "SPM100262454",
            "Product_Name": "Mac Laptop",
            "Product_Image": "/media/Laptop.jpg",
            "Reorder_Level": 10,
            "Min_Stock_Level": 10,
            "Opening_Balance": 5000
          },
          {
            "id": 70,
            "UOM": "pcs",
            "Product_Id": "SPM100262455",
            "Product_Name": "Knife",
            "Product_Image": "/media/1_807bcd15-c754-4efa-9b90-c6111d24a01e.webp",
            "Reorder_Level": 10,
            "Min_Stock_Level": 5,
            "Opening_Balance": 1000
          }
        ],
        "Store_Inchange": "Ravi Kumar",
        "Building_Name": "12A Greeta Tower",
        "Country": "India",
        "State": "Tamil nadu",
        "City": "CHennai",
        "Location": "Anna nagar",
        "Is_Deleted": false,
        "Created_Date": "2024-07-18T11:21:14.045309+05:30",
        "Updated_Date": "2024-07-18T11:21:14.045339+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 72
      }
    ],
    "Item_Id": [
      {
        "id": 4,
        "Product_Name": "Al.Flat_50 x 20",
        "Product_Description": "Test--1",
        "Product_Code": null,
        "Bar_Code": null,
        "HSN_Code": "FG0056",
        "SKU_Code": "GHF",
        "UOM": "kg",
        "Brand": "Century",
        "Price": "100",
        "Tax": "Payroll tax.",
        "Tax_Flag": true,
        "Is_Batch": false,
        "Product_Image": "https://backend.crmfarm.app/media/blob%25253Ahttp%25253A/demo.localhost%25253A3000/0a1dac04-05ad-41c5-92c8-1e0eb53fe118",
        "ProductGroup_id": "52",
        "ProductGroup_Name": "Aluminium",
        "ProductCategry_Name": "Raw Materials",
        "Opening_Balance": "2000",
        "Opening_Price": "90",
        "Refund_Applicable": null,
        "Within_Hours": 0,
        "Variant": null,
        "Product_Id": "PRO000000001",
        "Is_Deleted": true,
        "Created_Date": "2024-07-17T16:19:58.912261+05:30",
        "Updated_Date": "2024-07-17T16:19:58.912295+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 4
      }
    ]
  },
  {
    "id": 2,
    "OffersMaster_Id": "OFM000000002",
    "Offer_Name": "Festival Offer",
    "Offer_Code": "FEEEST2025",
    "Offer_Type": "percentage",
    "Offer_Value": 10,
    "Discount_Type": "Percentage",
    "Discount_Value": 10,
    "Is_Active": false,
    "Min_Purchase": 1000,
    "Max_Discount": 500,
    "Usage_Limit": 100,
    "Per_User_Limit": 2,
    "Usage_Count": 0,
    "Start_Date": "2026-04-01",
    "End_Date": "2026-04-30",
    "Status": "Expired",
    "Customer_Type": "all",
    "Applicable_Products": [
      {
        "id": 24,
        "sku": "Wire2024",
        "uom": "mtr",
        "name": "Wire",
        "brand": "polycab",
        "image": "/media/bug_po_38_oPcM4ej.png",
        "price": 5000,
        "stock": 1000,
        "category": "Electricals",
        "Product_Id": "SP1001024-25",
        "productGroup": "Raw materials"
      }
    ],
    "Applicable_Categories": [
      {
        "id": 1,
        "name": "Electricals",
        "count": 1
      }
    ],
    "Description": "Festival special discount",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": []
  },
  {
    "id": 1,
    "OffersMaster_Id": "OFM000000001",
    "Offer_Name": "Festival Offer",
    "Offer_Code": "FEST2026",
    "Offer_Type": "bank",
    "Offer_Value": 10,
    "Discount_Type": "Fixed",
    "Discount_Value": 10,
    "Is_Active": true,
    "Min_Purchase": 1000,
    "Max_Discount": 500,
    "Usage_Limit": 100,
    "Per_User_Limit": 2,
    "Usage_Count": 0,
    "Start_Date": "2026-04-01",
    "End_Date": "2026-04-30",
    "Status": "Active",
    "Customer_Type": "all",
    "Applicable_Products": [],
    "Applicable_Categories": [],
    "Description": "Festival special discount",
    "Bank_Offer_Id": [],
    "Store_Id": [],
    "Item_Id": [
      {
        "id": 4,
        "Product_Name": "Al.Flat_50 x 20",
        "Product_Description": "Test--1",
        "Product_Code": null,
        "Bar_Code": null,
        "HSN_Code": "FG0056",
        "SKU_Code": "GHF",
        "UOM": "kg",
        "Brand": "Century",
        "Price": "100",
        "Tax": "Payroll tax.",
        "Tax_Flag": true,
        "Is_Batch": false,
        "Product_Image": "https://backend.crmfarm.app/media/blob%25253Ahttp%25253A/demo.localhost%25253A3000/0a1dac04-05ad-41c5-92c8-1e0eb53fe118",
        "ProductGroup_id": "52",
        "ProductGroup_Name": "Aluminium",
        "ProductCategry_Name": "Raw Materials",
        "Opening_Balance": "2000",
        "Opening_Price": "90",
        "Refund_Applicable": null,
        "Within_Hours": 0,
        "Variant": null,
        "Product_Id": "PRO000000001",
        "Is_Deleted": true,
        "Created_Date": "2024-07-17T16:19:58.912261+05:30",
        "Updated_Date": "2024-07-17T16:19:58.912295+05:30",
        "Organization_Id": 1,
        "Created_By": 4,
        "Updated_By": 4
      }
    ]
  }
];

function getUserId(): number {
  if (typeof window === 'undefined') return 1;
  const raw =
    localStorage.getItem('UserId') ||
    localStorage.getItem('userId') ||
    localStorage.getItem('user_id') ||
    '1';
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 1 : parsed;
}

function getOrgId(): number {
  if (typeof window === 'undefined') return 1;
  const raw =
    localStorage.getItem('OrganizationId') ||
    localStorage.getItem('Organization_Id') ||
    localStorage.getItem('organizationId') ||
    '1';
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? 1 : parsed;
}

export function getLocalOffers(): OfferItem[] {
  const data = getLocalData<OfferItem>(STORAGE_KEY);
  if (!data || data.length === 0) {
    saveLocalData(STORAGE_KEY, INITIAL_OFFERS);
    return INITIAL_OFFERS;
  }
  return data;
}

/**
 * Fetch offers list with pagination, search, and backend filter POST
 * Matching RTK Query getOffers in old retail project
 */
export async function fetchOffersList(params?: {
  page?: number;
  search?: string;
  type?: string;
  status?: string;
  bank?: string;
  cardType?: string;
  showBankOnly?: boolean;
  fromDate?: string;
  toDate?: string;
}): Promise<{ results: OfferItem[]; count: number }> {
  const page = params?.page || 1;
  const search = params?.search?.trim() || '';
  const type = params?.type || '';
  const status = params?.status || '';
  const fromdate = params?.fromDate || '';
  const todate = params?.toDate || '';

  try {
    let res: any;

    if (search) {
      res = await fetchFromApi(`user/OffersMasterSearch/?search=${encodeURIComponent(search)}&page=${page}`);
    } else if (
      type ||
      status ||
      (fromdate && fromdate !== '2025-01-01') ||
      (todate && todate !== '2026-12-31')
    ) {
      res = await fetchFromApi('user/OffersMasterFilter/', {
        method: 'POST',
        body: JSON.stringify({
          OffersMaster_Id: '',
          Offer_Name: type || '',
          Offer_Code: '',
          Offer_Type: type || '',
          Status: status || '',
          fromdate: fromdate || '2025-01-01',
          todate: todate || '2026-12-31',
          page: page
        })
      });
    } else {
      res = await fetchFromApi(`user/OffersMasterList/?page=${page}`);
    }

    if (res) {
      let list: OfferItem[] = [];
      let count = 0;

      if (res.results && Array.isArray(res.results)) {
        list = res.results;
        count = res.count || res.total || res.results.length;
      } else if (res.data && Array.isArray(res.data)) {
        list = res.data;
        count = res.total || res.count || res.data.length;
      } else if (Array.isArray(res)) {
        list = res;
        count = res.length;
      } else if (res.OffersMasterList && Array.isArray(res.OffersMasterList)) {
        list = res.OffersMasterList;
        count = res.total_count || res.total || res.count || res.OffersMasterList.length;
      } else if (res.offers && Array.isArray(res.offers)) {
        list = res.offers;
        count = res.total_count || res.total || res.count || res.offers.length;
      }

      if (list.length > 0 || count > 0) {
        // Synchronize with local storage for instant availability
        list.forEach((item) => {
          upsertLocalItem(STORAGE_KEY, item, ['id', 'Offer_Code']);
        });
        return { results: list, count };
      }
    }
  } catch (err) {
    console.warn('[Offers API] Backend request failed, falling back to local storage:', err);
  }

  // Graceful local storage fallback with client-side filtering
  let items = getLocalOffers();

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (o) =>
        (o.Offer_Name && o.Offer_Name.toLowerCase().includes(q)) ||
        (o.Offer_Code && o.Offer_Code.toLowerCase().includes(q)) ||
        (Array.isArray(o.Bank_Offer_Id) &&
          o.Bank_Offer_Id.some((b: any) => b?.Bank_Name && b.Bank_Name.toLowerCase().includes(q)))
    );
  }

  if (status && status !== 'All') {
    items = items.filter((o) => o.Status?.toLowerCase() === status.toLowerCase());
  }

  if (type) {
    items = items.filter((o) => o.Offer_Type?.toLowerCase() === type.toLowerCase());
  }

  if (params?.showBankOnly) {
    items = items.filter((o) => o.Offer_Type?.toLowerCase() === 'bank');
  }

  if (params?.bank) {
    const targetBank = params.bank.toLowerCase();
    items = items.filter(
      (o) =>
        Array.isArray(o.Bank_Offer_Id) &&
        o.Bank_Offer_Id.some((b: any) => b?.Bank_Name && b.Bank_Name.toLowerCase() === targetBank)
    );
  }

  if (params?.cardType) {
    const targetCard = params.cardType.toLowerCase();
    items = items.filter(
      (o) =>
        Array.isArray(o.Bank_Offer_Id) &&
        o.Bank_Offer_Id.some(
          (b: any) =>
            b?.Card_Type &&
            (b.Card_Type.toLowerCase() === targetCard || b.Card_Type.toLowerCase() === 'both')
        )
    );
  }

  if (fromdate) {
    items = items.filter((o) => new Date(o.Start_Date) >= new Date(fromdate));
  }

  if (todate) {
    items = items.filter((o) => new Date(o.End_Date) <= new Date(todate));
  }

  return { results: items, count: items.length };
}

/**
 * Get single offer by ID
 * Endpoint: user/OffersMasterCRUD/?id=${id}
 */
export async function fetchOfferById(id: number | string): Promise<OfferItem | null> {
  try {
    const res = await fetchFromApi<any>(`user/OffersMasterCRUD/?id=${id}`);
    if (res) {
      const item = res.data || res.result || res;
      return item;
    }
  } catch (err) {
    console.warn('[Offers API] fetchOfferById failed:', err);
  }
  const localList = getLocalOffers();
  return localList.find((o) => String(o.id) === String(id)) || null;
}

/**
 * Fetch offer types
 * Endpoint: /user/types
 */
export async function fetchOfferTypes(): Promise<OfferTypeOption[]> {
  try {
    const res = await fetchFromApi<any>('user/types');
    if (res) {
      const rawTypes = res.data || res.results || res;
      if (Array.isArray(rawTypes) && rawTypes.length > 0) {
        return rawTypes.map((t: any) => {
          if (typeof t === 'string') return { value: t.toLowerCase(), label: t };
          return {
            value: (t.value || t.code || t.name || '').toLowerCase(),
            label: t.label || t.name || t.value || ''
          };
        });
      }
    }
  } catch (err) {
    console.warn('[Offers API] fetchOfferTypes backend failed, using defaults:', err);
  }
  return FALLBACK_OFFER_TYPES;
}

/**
 * Fetch bank list for offers
 * Endpoint: user/OfferBankDetailsCRUD/
 */
export async function fetchBanks(id?: number | string): Promise<any[]> {
  try {
    if (id) {
      const res = await fetchFromApi<any>(`user/OfferBankDetailsCRUD/?id=${id}`);
      if (res && !res.Error) {
        return Array.isArray(res) ? res : [res];
      }
    } else {
      // 1. Fetch live bank offers from user/OfferBankDetailsList/
      const listRes = await fetchFromApi<any>('user/OfferBankDetailsList/');
      if (listRes) {
        const list = listRes.results || listRes.data || (Array.isArray(listRes) ? listRes : []);
        if (list.length > 0) {
          return list;
        }
      }
      // 2. Fetch directly from user/OfferBankDetailsCRUD/
      const res = await fetchFromApi<any>('user/OfferBankDetailsCRUD/');
      if (res && !res.Error) {
        const list = res.data || res.results || (Array.isArray(res) ? res : [res]);
        if (list.length > 0) return list;
      }
    }
  } catch (err) {
    console.warn('[Offers API] fetchBanks failed, using fallback banks:', err);
  }
  return FALLBACK_BANKS;
}

/**
 * Fetch single bank offer by ID
 * Endpoint: user/OfferBankDetailsCRUD/?id=${id}
 */
export async function fetchBankOfferById(id: number | string): Promise<any | null> {
  try {
    const res = await fetchFromApi<any>(`user/OfferBankDetailsCRUD/?id=${id}`);
    if (res && !res.Error) {
      return res.data || res;
    }
  } catch (err) {
    console.warn('[Offers API] fetchBankOfferById failed:', err);
  }
  return null;
}

/**
 * Create Bank Offer
 * Endpoint: POST user/OfferBankDetailsCRUD/
 */
export async function createBankOfferRecord(bankData: Partial<BankOfferDetail>): Promise<any> {
  const payload = {
    Bank_Name: bankData.Bank_Name,
    Card_Type: bankData.Card_Type || 'Both',
    Discount_Type: bankData.Discount_Type || 'Percentage',
    Min_Transaction_Amount: parseFloat(String(bankData.Min_Transaction_Amount || bankData.Min_Transaction || 0)),
    Terms: bankData.Terms || '',
    Promo_Code: bankData.Promo_Code || '',
    Is_Active: true
  };

  try {
    const res = await fetchFromApi<any>('user/OfferBankDetailsCRUD/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res && (res.id || res.data?.id)) {
      return res.data || res;
    }
  } catch (err) {
    console.warn('[Offers API] createBankOffer backend failed, generating local ID:', err);
  }

  return { id: Date.now(), ...payload };
}

/**
 * Update Bank Offer
 * Endpoint: PUT user/OfferBankDetailsCRUD/
 */
export async function updateBankOfferRecord(id: number | string, bankData: Partial<BankOfferDetail>): Promise<any> {
  const payload = {
    id: id,
    Bank_Name: bankData.Bank_Name,
    Card_Type: bankData.Card_Type,
    Discount_Type: bankData.Discount_Type,
    Min_Transaction_Amount: parseFloat(String(bankData.Min_Transaction_Amount || bankData.Min_Transaction || 0)),
    Terms: bankData.Terms,
    Promo_Code: bankData.Promo_Code,
    Is_Active: bankData.Is_Active ?? true
  };

  try {
    const res = await fetchFromApi<any>('user/OfferBankDetailsCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    if (res) {
      return res.data || res;
    }
  } catch (err) {
    console.warn('[Offers API] updateBankOffer backend failed:', err);
  }

  return payload;
}

/**
 * Delete Bank Offer
 * Endpoint: DELETE user/OfferBankDetailsCRUD/${id}
 */
export async function deleteBankOfferRecord(id: number | string): Promise<boolean> {
  try {
    await fetchFromApi(`user/OfferBankDetailsCRUD/${id}`, {
      method: 'DELETE'
    });
    return true;
  } catch (err) {
    console.warn('[Offers API] deleteBankOffer failed:', err);
    return false;
  }
}

/**
 * Fetch customer types
 * Endpoint: /offers/customer-types
 */
export async function fetchCustomerTypes(): Promise<CustomerTypeOption[]> {
  try {
    const res = await fetchFromApi<any>('offers/customer-types');
    if (res) {
      const raw = res.data || res.results || res;
      if (Array.isArray(raw) && raw.length > 0) {
        return raw.map((c: any) => ({
          value: (c.value || c.code || c.name || '').toLowerCase(),
          label: c.label || c.name || c.value || ''
        }));
      }
    }
  } catch (err) {
    console.warn('[Offers API] fetchCustomerTypes failed, using defaults:', err);
  }
  return FALLBACK_CUSTOMER_TYPES;
}

/**
 * Fetch retail stores list
 * Endpoint: /user/StoreMasterList/?Is_Deleted=False
 */
export async function fetchStoresList(): Promise<StoreItem[]> {
  try {
    const res = await fetchFromApi<any>('/user/StoreMasterList/?Is_Deleted=False', { method: 'GET' });
    if (res) {
      const rawStores = res.data || res.results || res;
      if (Array.isArray(rawStores) && rawStores.length > 0) {
        return rawStores.map((s: any) => ({
          id: s.id || s.Store_Id,
          name: s.Store_Name || s.name || s.StoreName || `Store #${s.id}`,
          Store_Name: s.Store_Name || s.name || s.StoreName || `Store #${s.id}`,
          Store_Code: s.Store_Code || s.code || '',
          Store_Type: s.Store_Type || s.type || '',
          Address: s.Address || s.address || ''
        }));
      }
    }
  } catch (err) {
    console.warn('[Offers API] fetchStoresList backend failed:', err);
  }

  return [
    { id: 1, name: 'Main City Flagship Store', Store_Name: 'Main City Flagship Store' },
    { id: 2, name: 'Indiranagar Mall Outlet', Store_Name: 'Indiranagar Mall Outlet' },
    { id: 3, name: 'Koramangala Supermarket', Store_Name: 'Koramangala Supermarket' },
    { id: 4, name: 'Whitefield Tech Park Store', Store_Name: 'Whitefield Tech Park Store' }
  ];
}

/**
 * Fetch products by store list or fallback to product master
 * Endpoint: user/RetailStoreWiseProducts/ (POST) or /user/SalesProductMasterList/ (GET)
 */
export async function fetchProductsByStore(storeIds: Array<number | string>): Promise<ProductItem[]> {
  try {
    let rawProducts: any[] = [];

    if (storeIds && storeIds.length > 0) {
      const numStoreIds = storeIds.map((id) => (typeof id === 'string' ? parseInt(id, 10) || id : id));
      const res = await fetchFromApi<any>('user/RetailStoreWiseProducts/', {
        method: 'POST',
        body: JSON.stringify({ StoreIds: numStoreIds })
      });
      if (res) {
        rawProducts = res.data || res.results || (Array.isArray(res) ? res : []);
      }
    }

    // If store-specific call returned empty or no store was selected, fallback to SalesProductMasterList
    if (!rawProducts || rawProducts.length === 0) {
      const masterRes = await fetchFromApi<any>('/user/SalesProductMasterList/', { method: 'GET' });
      if (masterRes) {
        rawProducts = masterRes.data || masterRes.results || (Array.isArray(masterRes) ? masterRes : []);
      }
    }

    if (Array.isArray(rawProducts) && rawProducts.length > 0) {
      return rawProducts.map((p: any) => ({
        id: p.id || p.Product_Id,
        Product_Id: p.Product_Id || p.id,
        name: p.Product_Name || p.name || 'Unnamed Product',
        Product_Name: p.Product_Name || p.name || 'Unnamed Product',
        sku: p.SKU_Code || p.sku || p.Product_Code || `SKU-${p.id}`,
        SKU_Code: p.SKU_Code || p.sku || p.Product_Code,
        category: p.ProductCategry_Name || p.category || p.Category_Name || 'General',
        ProductCategry_Name: p.ProductCategry_Name || p.category || 'General',
        productGroup: p.ProductGroup_Name,
        ProductGroup_Name: p.ProductGroup_Name,
        price: parseFloat(String(p.Price || p.Unit_Price || 0)) || 0,
        Price: parseFloat(String(p.Price || p.Unit_Price || 0)) || 0,
        stock: parseInt(String(p.Opening_Balance || p.Stock_Aval || p.stock || 0), 10) || 0,
        Opening_Balance: parseInt(String(p.Opening_Balance || p.Stock_Aval || p.stock || 0), 10) || 0,
        uom: p.UOM || p.uom || 'Unit',
        UOM: p.UOM || p.uom || 'Unit',
        brand: p.Brand || p.brand || '',
        Brand: p.Brand || p.brand || '',
        image: p.Product_Image || p.image || ''
      }));
    }
  } catch (err) {
    console.warn('[Offers API] fetchProductsByStore failed, using fallback catalog:', err);
  }

  return [
    { id: 101, Product_Id: 101, name: 'Wireless Bluetooth Headphones Pro', sku: 'EL-HP-001', category: 'Electronics', price: 2999, stock: 45 },
    { id: 102, Product_Id: 102, name: 'Smart Fitness Band Pro', sku: 'EL-FB-002', category: 'Electronics', price: 1899, stock: 68 },
    { id: 103, Product_Id: 103, name: 'USB-C Ultra Fast Charger 65W', sku: 'AC-CH-003', category: 'Accessories', price: 1299, stock: 120 },
    { id: 104, Product_Id: 104, name: 'Active Noise Cancelling Earbuds', sku: 'EL-EB-004', category: 'Electronics', price: 3499, stock: 32 },
    { id: 201, Product_Id: 201, name: 'Cotton Classic Oxford Shirt', sku: 'AP-SH-101', category: 'Apparel', price: 1499, stock: 55 },
    { id: 202, Product_Id: 202, name: 'Slim Fit Denim Jeans', sku: 'AP-JN-102', category: 'Apparel', price: 2199, stock: 40 },
    { id: 203, Product_Id: 203, name: 'Comfort Athletic Running Shoes', sku: 'FW-RS-201', category: 'Footwear', price: 3299, stock: 24 },
    { id: 204, Product_Id: 204, name: 'Casual Leather Loafers', sku: 'FW-LF-202', category: 'Footwear', price: 2799, stock: 18 },
    { id: 301, Product_Id: 301, name: 'Stainless Steel Insulated Bottle 1L', sku: 'HK-BT-301', category: 'Home & Kitchen', price: 799, stock: 85 },
    { id: 302, Product_Id: 302, name: 'Organic Cold Pressed Almond Oil', sku: 'HB-AO-302', category: 'Health & Beauty', price: 599, stock: 150 },
    { id: 303, Product_Id: 303, name: 'Ultra Soft Bamboo Bath Towel', sku: 'HK-TW-303', category: 'Home & Kitchen', price: 649, stock: 95 }
  ];
}

/**
 * Create new offer in backend
 * Endpoint: POST user/OffersMasterCRUD/
 */
export async function createOfferRecord(offerData: Partial<OfferItem>): Promise<OfferItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const payload: any = {
    ...offerData,
    Created_By: userId,
    Updated_By: userId,
    Organization_Id: orgId
  };

  try {
    const res = await fetchFromApi<any>('user/OffersMasterCRUD/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (res && (res.id || res.OffersMaster_Id || res.data?.id)) {
      const createdItem = res.data || res;
      upsertLocalItem(STORAGE_KEY, createdItem, ['id', 'Offer_Code']);
      return createdItem;
    }
  } catch (err) {
    console.warn('[Offers API] Create backend failed, saving locally:', err);
  }

  const fallbackCreated: OfferItem = {
    id: Date.now(),
    Offer_Name: offerData.Offer_Name || 'New Promotional Offer',
    Offer_Code: offerData.Offer_Code || `OFFER${Math.floor(1000 + Math.random() * 9000)}`,
    Offer_Type: offerData.Offer_Type || 'percentage',
    Description: offerData.Description || '',
    Offer_Value: Number(offerData.Offer_Value || offerData.Discount_Value) || 10,
    Discount_Type: offerData.Discount_Type || 'percentage',
    Discount_Value: Number(offerData.Discount_Value || offerData.Offer_Value) || 10,
    Max_Discount: Number(offerData.Max_Discount) || 1000,
    Min_Purchase: Number(offerData.Min_Purchase) || 500,
    Customer_Type: offerData.Customer_Type || 'all',
    Start_Date: offerData.Start_Date || new Date().toISOString().split('T')[0],
    End_Date: offerData.End_Date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    Status: (offerData.Status as any) || 'Active',
    Usage_Count: 0,
    Usage_Limit: Number(offerData.Usage_Limit) || 500,
    Per_User_Limit: Number(offerData.Per_User_Limit || offerData.Per_Customer_Limit) || 1,
    Applicable_Products: offerData.Applicable_Products || [],
    Applicable_Categories: offerData.Applicable_Categories || [],
    Bank_Offer_Id: offerData.Bank_Offer_Id || [],
    Created_Date: new Date().toISOString()
  };

  upsertLocalItem(STORAGE_KEY, fallbackCreated, ['id', 'Offer_Code']);
  return fallbackCreated;
}

/**
 * Update existing offer in backend
 * Endpoint: PUT user/OffersMasterCRUD/
 */
export async function updateOfferRecord(id: number | string, updatedData: Partial<OfferItem>): Promise<OfferItem> {
  const userId = getUserId();
  const orgId = getOrgId();

  const payload: any = {
    id: id,
    ...updatedData,
    Created_By: userId,
    Updated_By: userId,
    Organization_Id: orgId
  };

  try {
    const res = await fetchFromApi<any>('user/OffersMasterCRUD/', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (res && (res.id || res.OffersMaster_Id || res.data?.id)) {
      const updatedItem = res.data || res;
      upsertLocalItem(STORAGE_KEY, updatedItem, ['id']);
      return updatedItem;
    }
  } catch (err) {
    console.warn('[Offers API] Update backend failed, updating locally:', err);
  }

  const items = getLocalOffers();
  const idx = items.findIndex((o) => String(o.id) === String(id));
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updatedData };
    saveLocalData(STORAGE_KEY, items);
    return items[idx];
  }

  return { id, ...updatedData } as OfferItem;
}

/**
 * Delete offer in backend
 * Endpoint: DELETE user/OffersMasterCRUD/${id}
 */
export async function deleteOfferRecord(id: number | string): Promise<boolean> {
  try {
    await fetchFromApi(`user/OffersMasterCRUD/${id}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('[Offers API] Delete backend failed, removing locally:', err);
  }

  deleteLocalItem(STORAGE_KEY, id, ['id']);
  return true;
}

/**
 * Fetch offers analytics
 * Endpoint: /user/OfferAnalytics/
 */
export async function fetchOffersAnalytics(): Promise<OfferAnalytics> {
  try {
    const res = await fetchFromApi<any>('/user/OfferAnalytics/');
    if (res) {
      const data = res.data || res;
      const statusBreakdown = data.status_breakdown || {
        active: data.active_offers || 0,
        scheduled: data.scheduled_offers || 0,
        expired: data.expired_offers || 0,
        draft: data.draft_offers || 0
      };

      const topOffers = Array.isArray(data.top_offers)
        ? data.top_offers.map((top: any) => ({
            id: top.id || top.OffersMaster_Id || Math.random(),
            Offer_Name: top.Offer_Name || top.name || 'Promotion',
            Offer_Code: top.Offer_Code || top.code || 'CODE',
            Offer_Type: top.Offer_Type || top.type || 'percentage',
            Usage_Count: top.Usage_Count || top.usage_count || top.redemptions || 0,
            Total_Discount: top.Total_Discount || top.Total_Revenue || top.total_discount || 0,
            Total_Revenue: top.Total_Revenue || top.total_revenue || 0,
            conversion_rate: top.conversion_rate || 0,
            Status: top.Status || top.status || 'Active'
          }))
        : [];

      return {
        total_offers: data.total_offers || data.totalOffers || 0,
        active_offers: data.active_offers || data.activeOffers || 0,
        scheduled_offers: statusBreakdown.scheduled || 0,
        expired_offers: statusBreakdown.expired || 0,
        draft_offers: statusBreakdown.draft || 0,
        total_redemptions: data.total_redemptions || data.totalRedemptions || 0,
        total_discount_value: data.total_discount_value || data.total_discount || 0,
        active_conversion: data.active_conversion || 0,
        status_breakdown: statusBreakdown,
        top_offers: topOffers
      };
    }
  } catch (err) {
    console.warn('[Offers API] Analytics backend failed, computing locally:', err);
  }

  // Local fallback calculation
  const list = getLocalOffers();
  const active = list.filter((o) => o.Status === 'Active').length;
  const scheduled = list.filter((o) => o.Status === 'Scheduled').length;
  const expired = list.filter((o) => o.Status === 'Expired').length;
  const draft = list.filter((o) => o.Status === 'Draft').length;
  const totalRedemptions = list.reduce((sum, o) => sum + (o.Usage_Count || 0), 0);
  const totalDiscount = list.reduce(
    (sum, o) => sum + (o.Usage_Count || 0) * (Number(o.Discount_Value || o.Offer_Value) || 100),
    0
  );

  return {
    total_offers: list.length,
    active_offers: active,
    scheduled_offers: scheduled,
    expired_offers: expired,
    draft_offers: draft,
    total_redemptions: totalRedemptions,
    total_discount_value: totalDiscount,
    active_conversion: list.length > 0 ? Math.round((active / list.length) * 100) : 0,
    status_breakdown: {
      active,
      scheduled,
      expired,
      draft
    },
    top_offers: list.slice(0, 5).map((o) => ({
      id: o.id,
      Offer_Name: o.Offer_Name,
      Offer_Code: o.Offer_Code,
      Offer_Type: o.Offer_Type,
      Usage_Count: o.Usage_Count || 0,
      Total_Discount: (o.Usage_Count || 0) * (Number(o.Discount_Value || o.Offer_Value) || 50),
      Status: o.Status
    }))
  };
}
