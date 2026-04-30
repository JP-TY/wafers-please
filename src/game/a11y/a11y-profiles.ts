export interface A11yProfile {
  id: "default" | "high-contrast" | "large-text";
  label: string;
  className?: string;
  description: string;
}

export const a11yProfiles: A11yProfile[] = [
  {
    id: "default",
    label: "Default",
    description: "Standard visual profile."
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    className: "high-contrast",
    description: "Increases panel and text contrast."
  },
  {
    id: "large-text",
    label: "Large Text",
    className: "large-text",
    description: "Increases body text size for readability."
  }
];
