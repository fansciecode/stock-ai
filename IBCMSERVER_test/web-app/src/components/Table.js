import React from "react";

const Table = ({ headers, data }) => {
  return (
    <table className="w-full border-collapse border border-gray-300">
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} className="border border-gray-300 p-2">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index}>
            {Object.values(row).map((cell, i) => (
              <td key={i} className="border border-gray-300 p-2">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
