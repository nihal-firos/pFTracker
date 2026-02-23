export interface ReportSummary {
  income: string;
  expenses: string;
  net: string;
}

export interface ReportCategoryItem {
  category_id: number;
  category_name: string;
  category_color: string;
  type: "income" | "expense";
  total: string;
  percentage: string;
}

export interface ReportByCategoryResponse {
  items: ReportCategoryItem[];
  total: string;
}

export interface ReportMonthlyItem {
  month: string;
  income: string;
  expenses: string;
  net: string;
}

export interface ReportMonthlyResponse {
  items: ReportMonthlyItem[];
}