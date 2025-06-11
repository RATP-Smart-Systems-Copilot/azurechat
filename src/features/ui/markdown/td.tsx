import React from "react";
export const td = {
    render: "Td",
};

export const Td = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  if (typeof children === "string" && children.includes("<br")) {
    return (
      <td scope="col" className="px-6 py-3 hover:bg-secondary">
        {renderWithBreaks(children)}
      </td>
    );
  }

  return (
    <td scope="col" className="px-6 py-3 hover:bg-secondary">
      {children}
    </td>
  );
};

function renderWithBreaks(text: string): React.ReactNode[] {
  return text.split(/<br\s*\/?>/i).reduce<React.ReactNode[]>((acc, part, index, arr) => {
    acc.push(part);
    if (index < arr.length - 1) {
      acc.push(<br key={index} />);
    }
    return acc;
  }, []);
}
