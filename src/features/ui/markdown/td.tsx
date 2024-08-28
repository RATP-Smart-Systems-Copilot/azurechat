export const td = {
    render: "Td",
};

export const Td = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    return <td  scope="col" className="px-6 py-3 hover:bg-secondary">
        {children}
    </td>;
};

