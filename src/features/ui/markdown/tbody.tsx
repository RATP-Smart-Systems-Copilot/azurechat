export const tbody = {
    render: "Tbody",
};

export const Tbody = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    return <tbody className="text-muted-foreground">
        {children}
    </tbody>;
};

