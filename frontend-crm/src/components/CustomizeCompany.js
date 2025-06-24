import { useState } from "react";
import axios from "axios";
import config from '../config';

export default function CustomizeCompany() {
  const [form, setForm] = useState({
    company_name: "",
    primary_color: "#1e3a8a",   // Azul por defecto
    secondary_color: "#10b981", // Verde por defecto
    logo: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleFileChange = (e) => {
    setForm({ ...form, logo: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const data = new FormData();
    data.append("company_name", form.company_name);
    data.append("primary_color", form.primary_color);
    data.append("secondary_color", form.secondary_color);
    if (form.logo) data.append("logo", form.logo);

    try {
      await axios.post(`${config.apiUrl}/api/company/customize/`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Datos personalizados guardados con éxito");
    } catch (err) {
      console.error(err);
      alert("Error al guardar la personalización");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-xl space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-indigo-700">
          Personaliza tu Empresa
        </h2>

        <input
          type="text"
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          placeholder="Nombre de la empresa"
          className="w-full border p-3 rounded"
          required
        />

        <div className="flex gap-4">
          <label className="flex flex-col text-sm text-gray-600">
            Color Primario
            <input
              type="color"
              name="primary_color"
              value={form.primary_color}
              onChange={handleChange}
              className="h-10 w-full"
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Color Secundario
            <input
              type="color"
              name="secondary_color"
              value={form.secondary_color}
              onChange={handleChange}
              className="h-10 w-full"
            />
          </label>
        </div>

        <label className="text-sm text-gray-600">
          Logo de la empresa
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-2"
          />
        </label>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
        >
          Guardar Personalización
        </button>
      </form>
    </div>
  );
}
