import { fetchFromApi } from '@/service/apiClient';

export interface ApiCustomForm {
  id: number;
  FormName: string;
  FormSTR: {
    fields?: Array<{
      id?: string;
      label: string;
      type: string;
      placeholder?: string;
      helpText?: string;
      required: boolean;
      validation?: string;
      options?: string[];
      sectionPlacement?: string;
      customSectionName?: string;
    }>;
    components?: any[]; // legacy form.io compatibility
    module?: 'Leads' | 'Contacts' | 'Deals' | 'Support' | 'Events';
    description?: string;
    rules?: any[];
    notifications?: any;
  };
  Is_Deleted: boolean;
  Is_Active: boolean;
  Created_Date: string;
  Updated_Date: string;
  Created_By: number;
  Updated_By: number;
}

export function mapApiFormToUiForm(apiForm: any) {
  const formStr = apiForm.FormSTR || {};
  let fields: any[] = [];
  
  if (Array.isArray(formStr.fields)) {
    fields = formStr.fields.map((f: any) => ({
      id: f.id || `f-${Math.random().toString(36).substr(2, 9)}`,
      type: f.type || 'text',
      label: f.label || '',
      placeholder: f.placeholder || '',
      helpText: f.helpText || '',
      required: f.required !== undefined ? f.required : false,
      validation: f.validation || '',
      options: f.options || [],
      sectionPlacement: f.sectionPlacement || 'Basic Information',
      customSectionName: f.customSectionName || '',
      orderIndex: f.orderIndex
    }));
  } else if (Array.isArray(formStr.components)) {
    // Form.io format compatibility
    fields = formStr.components
      .filter((c: any) => c.type !== 'button') // Skip submit button
      .map((c: any) => {
        let type = 'text';
        if (c.type === 'textfield') {
          if (c.inputType === 'email' || c.key?.toLowerCase().includes('email')) type = 'email';
          else if (c.inputType === 'number' || c.key?.toLowerCase().includes('number') || c.key?.toLowerCase().includes('phone')) type = 'phone';
          else type = 'text';
        } else if (c.type === 'textarea') {
          type = 'textarea';
        } else if (c.type === 'number') {
          type = 'number';
        } else if (c.type === 'select' || c.type === 'dropdown') {
          type = 'dropdown';
        } else if (c.type === 'checkbox') {
          type = 'checkbox';
        }
        
        let options: string[] = [];
        if (c.data?.values) {
          options = c.data.values.map((v: any) => v.label || v.value || '');
        } else if (Array.isArray(c.options)) {
          options = c.options;
        }

        return {
          id: c.id || c.key || `f-${Math.random().toString(36).substr(2, 9)}`,
          type: type,
          label: c.label || c.key || '',
          placeholder: c.placeholder || '',
          helpText: c.tooltip || c.description || '',
          required: !!c.validate?.required,
          validation: '',
          options: options,
          sectionPlacement: c.sectionPlacement || 'Basic Information',
          customSectionName: c.customSectionName || ''
        };
      });
  }

  return {
    id: apiForm.id.toString(),
    name: apiForm.FormName || 'Untitled Form',
    module: formStr.module || 'Leads',
    description: formStr.description || apiForm.FormName || '',
    lastUpdated: apiForm.Updated_Date || apiForm.Created_Date || '',
    status: apiForm.Is_Active ? 'Active' : 'Inactive',
    fields: fields,
    rules: formStr.rules || [],
    sectionOrder: formStr.sectionOrder || [],
    notifications: formStr.notifications || {
      alertRecordOwner: true,
      alertSlackFeed: false,
      alertSysAdmin: false,
      alertEmails: ''
    }
  };
}

export async function fetchCustomForms(): Promise<any[]> {
  const res = await fetchFromApi(`/user/CustomizeFormlist/`, {
    method: 'GET',
    cache: 'no-store'
  });
  if (Array.isArray(res)) {
    return res.map(mapApiFormToUiForm);
  }
  return [];
}

export async function fetchCustomFormById(id: string | number): Promise<any> {
  const res = await fetchFromApi(`/user/CustomizeFormCRUD/?id=${id}`, {
    method: 'GET',
    cache: 'no-store'
  });
  if (Array.isArray(res)) {
    if (res.length > 0) return mapApiFormToUiForm(res[0]);
  } else if (res && typeof res === 'object') {
    if (Array.isArray(res.results) && res.results.length > 0) {
      return mapApiFormToUiForm(res.results[0]);
    }
    return mapApiFormToUiForm(res);
  }
  throw new Error(`Custom Form not found with ID ${id}`);
}

export async function createCustomForm(formData: {
  FormName: string;
  FormSTR: any;
  Is_Active?: boolean;
}): Promise<any> {
  const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userId = userIdStr ? parseInt(userIdStr, 10) : 1;

  const payload = {
    FormName: formData.FormName,
    FormSTR: formData.FormSTR,
    Is_Deleted: false,
    Is_Active: formData.Is_Active !== undefined ? formData.Is_Active : true,
    Created_By: userId,
    Updated_By: userId,
  };

  return fetchFromApi('/user/CustomizeFormCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateCustomForm(
  id: string | number,
  formData: {
    FormName: string;
    FormSTR: any;
    Is_Active?: boolean;
    Created_Date?: string;
  }
): Promise<any> {
  const userIdStr = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const userId = userIdStr ? parseInt(userIdStr, 10) : 1;
  const today = new Date().toISOString().split('T')[0];

  const payload = {
    id: typeof id === 'string' ? parseInt(id, 10) : id,
    FormName: formData.FormName,
    FormSTR: formData.FormSTR,
    Is_Deleted: false,
    Is_Active: formData.Is_Active !== undefined ? formData.Is_Active : true,
    Created_Date: formData.Created_Date || today,
    Updated_Date: today,
    Created_By: userId,
    Updated_By: userId,
  };

  return fetchFromApi('/user/CustomizeFormCRUD/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteCustomForm(id: string | number): Promise<any> {
  return fetchFromApi(`/user/CustomizeFormCRUD/?id=${id}`, {
    method: 'DELETE',
  });
}

export async function submitCustomForm(payload: {
  form_id: number;
  form_name: string;
  data: Record<string, any>;
}): Promise<any> {
  return fetchFromApi('/user/CustomizeFormSubmissionCRUD/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
