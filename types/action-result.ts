  export type ActionResult =
  | { success: true }
  | {
      success: false;
      errorCode?: string;
      fieldErrors?: Record<string, string[]>;
      upgrade?: boolean;
    };

export type ActionResultWithData<T> =
  | { success: true; data: T }
  | {
      success: false;
      errorCode?: string;
      fieldErrors?: Record<string, string[]>;
      upgrade?: boolean; 
    };

  
export type ActionResultWithId =
  | { success: true; id: string }
  | { success: false; errorCode?: string; fieldErrors?: Record<string, string[]> };

 export type ActionResultWithSlug =
  | { success: true; slug: string }
  | { success: false; errorCode?: string; fieldErrors?: Record<string, string[]> };


export type ActionResultWithMemberIds =
  | { success: true; memberIds: string[] }
  | { success: false; errorCode?: string };


export type ActionResultWithUrl =
  | { success: true; url: string }
  | { success: false; errorCode: string };