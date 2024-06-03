import { useState } from "react";
import { Modal, Button, Accordion, ListGroup } from "react-bootstrap";
import { FaUserAlt } from "react-icons/fa";

const FloatingIcon: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <>
      <div
        className="position-fixed d-flex justify-content-center align-items-center"
        style={{
          bottom: "20px",
          right: "20px",
          width: "50px",
          height: "50px",
          backgroundColor: "black",
          borderRadius: "50%",
          cursor: "pointer",
          zIndex: "1000",
        }}
        onClick={handleShowModal}
      >
        <FaUserAlt size={24} color="white" />
      </div>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>About App</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>About Me</Accordion.Header>
              <Accordion.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    Hari Krishna Anem
                  </ListGroup.Item>
                  <ListGroup.Item>
                    +91 9885699666
                  </ListGroup.Item>
                  <ListGroup.Item>
                    anemharikrishna@gmail.com
                  </ListGroup.Item>
                  <ListGroup.Item>
                  <a
                          href="https://www.linkedin.com/in/anemharikrishna/"
                          target="_blank"
                        >
                          LinkedIn
                        </a>
                  </ListGroup.Item>
                  <ListGroup.Item>
                  <a
                          href="https://github.com/HariKrishna-9885699666/"
                          target="_blank"
                        >
                          Github
                        </a>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <a
                          href="https://harikrishna.netlify.app/"
                          target="_blank"
                        >
                          Portfolio
                        </a>
                  </ListGroup.Item>
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item eventKey="1">
              <Accordion.Header>Packages Used</Accordion.Header>
              <Accordion.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>React Bootstrap</ListGroup.Item>
                  <ListGroup.Item>Socket IO</ListGroup.Item>
                  <ListGroup.Item>Typescript</ListGroup.Item>
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FloatingIcon;