import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Image, Row, Col } from "react-bootstrap";
import api from "../api";
import { showConfirm, showSuccess, showApiError } from "../utils/sweetAlert";
import MapModal from "./MapModal";

export default function HallEditModal({ show, onHide, hall, onSaved }) {
  const isEditing = !!hall;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    price: "",
    description: "",
  });
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (hall) {
      setForm({
        name: hall.name || "",
        address: hall.address || "",
        price: hall.price || "",
        description: hall.description || "",
      });
      setExistingImages(hall.images || []);
      setSelectedLocation(hall.location || null);
    } else {
      setForm({ name: "", address: "", price: "", description: "" });
      setExistingImages([]);
      setSelectedLocation(null);
    }
    setNewFiles([]);
  }, [hall, show]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setNewFiles(files);
  };

  const handleRemoveExistingImage = async (imgId) => {
    const result = await showConfirm(
      "Brisanje slike",
      "Da li ste sigurni da želite da obrišete ovu sliku?"
    );

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/halls/images/${imgId}/`);
      setExistingImages((prev) => prev.filter((i) => i.id !== imgId));
      await showSuccess("Slika uspešno obrisana!");
    } catch (err) {
      console.error("delete image error", err);
      showApiError(err);
    }
  };

  const uploadNewFiles = async (hallId) => {
    if (!newFiles.length) return;

    for (const file of newFiles) {
      const fd = new FormData();
      fd.append("image", file);
      await api.post(`/halls/${hallId}/images/`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
  };

  const handleLocationSet = (location) => {
    setSelectedLocation(location);
    setShowMapModal(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hallData = {
        name: form.name,
        address: form.address,
        price: form.price,
        description: form.description,
      };

      if (selectedLocation) {
        hallData.location = selectedLocation;
      }

      if (isEditing) {
        await api.put(`/halls/${hall.id}/`, hallData);
        await uploadNewFiles(hall.id);
        await showSuccess("Hala uspešno ažurirana!");
      } else {
        const res = await api.post("/halls/create/", hallData);
        const newHall = res.data;
        await uploadNewFiles(newHall.id);
        await showSuccess("Hala uspešno kreirana!");
      }

      onSaved && onSaved();
    } catch (err) {
      console.error("save hall error", err);
      showApiError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Form onSubmit={handleSave}>
          <Modal.Header closeButton>
            <Modal.Title>
              {isEditing ? "Izmeni Halu" : "Kreiraj Halu"}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Naziv</Form.Label>
              <Form.Control
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Adresa</Form.Label>
              <div className="d-flex gap-2 align-items-start">
                <Form.Control
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  required
                  placeholder="Unesite adresu hale"
                  className="flex-grow-1"
                />
                <Button
                  variant="outline-primary"
                  onClick={() => setShowMapModal(true)}
                  title="Postavi tačnu lokaciju na mapi"
                  style={{ whiteSpace: "nowrap" }}
                >
                  🗺️ Lokacija
                </Button>
              </div>
              <Form.Text className="text-muted">
                {selectedLocation
                  ? `Lokacija postavljena: ${selectedLocation.lat?.toFixed(
                      4
                    )}, ${selectedLocation.lng?.toFixed(4)}`
                  : 'Kliknite na dugme "Lokacija" da postavite tačnu poziciju na mapi'}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Cena (po satu)</Form.Label>
              <Form.Control
                name="price"
                value={form.price}
                onChange={handleChange}
                type="number"
                step="0.01"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Opis</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={form.description}
                onChange={handleChange}
              />
            </Form.Group>

            <hr />

            <Form.Group className="mb-3">
              <Form.Label>Postojeće slike</Form.Label>
              {existingImages.length === 0 ? (
                <div className="text-muted">Nema slika</div>
              ) : (
                <Row xs={3} className="g-2">
                  {existingImages.map((img) => (
                    <Col key={img.id} className="position-relative">
                      <Image
                        src={
                          img.image.startsWith("http")
                            ? img.image
                            : `${
                                import.meta.env.VITE_API_URL ||
                                "http://localhost:8000"
                              }${img.image}`
                        }
                        thumbnail
                        style={{
                          width: "100%",
                          height: 110,
                          objectFit: "cover",
                        }}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        style={{ position: "absolute", top: 6, right: 6 }}
                        onClick={() => handleRemoveExistingImage(img.id)}
                      >
                        X
                      </Button>
                    </Col>
                  ))}
                </Row>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Dodaj nove slike (više odjednom)</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              {newFiles.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  {newFiles.length} nova fajl(a) spremna za upload
                </div>
              )}
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Otkaži
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading
                ? "Čuvanje..."
                : isEditing
                ? "Sačuvaj izmene"
                : "Kreiraj halu"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <MapModal
        show={showMapModal}
        onHide={() => setShowMapModal(false)}
        hall={hall}
        selectedLocation={selectedLocation}
        onLocationSet={handleLocationSet}
      />
    </>
  );
}
