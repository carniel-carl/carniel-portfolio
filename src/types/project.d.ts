type ProjectDataType = {
  name: string;
  img: string;
  live: string;
  code: string;
  description: string;
  stack: string[];
};

type ProjectCardTypes = {
  project: ProjectDataType;
  image?: ReactNode;
  info?: ReactNode;
  action?: ReactNode;
  variant?: PropsVariantType;
};

export { ProjectCardTypes, ProjectDataType };
