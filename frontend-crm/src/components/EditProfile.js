import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from '../config';

export default function EditProfile() {
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    company_name: "",
    phonePrefix: "+591",
    phoneNumber: "",
    country: "Bolivia",
    language: "Español",
    company_size: "menos de 5 empleados",
    interest: "Utilizarlo en mi empresa",
    new_password: "",
  });

  const navigate = useNavigate();

  const countryPhoneCodes = {
    Bolivia: "+591",
    Argentina: "+54",
    Chile: "+56",
    Perú: "+51",
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${config.apiUrl}/api/users/profile/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const { username, email, first_name, last_name, company_name, phone, country, language, company_size, interest } = res.data;
        const phonePrefix = countryPhoneCodes[country] || "+591";
        const phoneNumber = phone.replace(phonePrefix, "");

        setFormData({
          full_name: `${first_name} ${last_name}`,
          username,
          email,
          company_name,
          phonePrefix,
          phoneNumber,
          country,
          language,
          company_size,
          interest,
          new_password: "",
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "country") {
      setFormData((prev) => ({
        ...prev,
        country: value,
        phonePrefix: countryPhoneCodes[value] || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const [first_name, ...last_parts] = formData.full_name.trim().split(" ");
    const last_name = last_parts.join(" ");
    const phone = formData.phonePrefix + formData.phoneNumber;

    const dataToSend = {
      username: formData.username,
      email: formData.email,
      first_name,
      last_name,
      company_name: formData.company_name,
      phone,
      country: formData.country,
      language: formData.language,
      company_size: formData.company_size,
      interest: formData.interest,
      new_password: formData.new_password,
    };

    axios
      .put(`${config.apiUrl}/api/users/profile/update/`, dataToSend, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => {
        alert("Perfil actualizado correctamente");
        navigate("/profile");
      })
      .catch((err) => {
        console.error(err);
        alert("Error al actualizar el perfil");
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-lg">
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">Editar Perfil</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            placeholder="Nombre y apellidos"
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="text"
            name="username"
            value={formData.username}
            placeholder="Nombre de usuario"
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="Correo electrónico"
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <div className="flex gap-2">
            <input
              type="text"
              name="phonePrefix"
              value={formData.phonePrefix}
              readOnly
              className="w-24 border p-3 rounded bg-gray-100 text-gray-700"
            />
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Número de teléfono"
              required
              className="flex-1 border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <input
            type="text"
            name="company_name"
            value={formData.company_name}
            placeholder="Nombre de la empresa"
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <select
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Bolivia">Bolivia</option>
            <option value="Argentina">Argentina</option>
            <option value="Chile">Chile</option>
            <option value="Perú">Perú</option>
          </select>

          <select
            name="language"
            value={formData.language}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Español">Español</option>
            <option value="Inglés">Inglés</option>
            <option value="Portugués">Portugués</option>
          </select>

          <select
            name="company_size"
            value={formData.company_size}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="menos de 5 empleados">menos de 5 empleados</option>
            <option value="5 a 10 empleados">5 a 10 empleados</option>
            <option value="11 a 50 empleados">11 a 50 empleados</option>
            <option value="más de 50 empleados">más de 50 empleados</option>
          </select>

          <select
            name="interest"
            value={formData.interest}
            onChange={handleChange}
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Utilizarlo en mi empresa">Utilizarlo en mi empresa</option>
            <option value="Solo estoy explorando">Solo estoy explorando</option>
            <option value="Soy desarrollador o consultor">Soy desarrollador o consultor</option>
          </select>

          <input
            type="password"
            name="new_password"
            value={formData.new_password}
            onChange={handleChange}
            placeholder="Nueva contraseña (opcional)"
            className="border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            type="submit"
            className="bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition"
          >
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}
