export const tr = {
    render: "Tr",
};

export const Tr = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    return <tr>
        {children}
    </tr>;
};

