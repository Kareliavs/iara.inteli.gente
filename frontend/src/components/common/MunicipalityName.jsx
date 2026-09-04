import { cn } from "@/lib/utils";

const MunicipalityName = ({
  as: Component = "span",
  className,
  children,
  ...props
}) => (
  <Component
    className={cn("notranslate", className)}
    translate="no"
    lang="pt-BR"
    {...props}
  >
    {children}
  </Component>
);

export default MunicipalityName;
