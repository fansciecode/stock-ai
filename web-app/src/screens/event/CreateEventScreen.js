import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  TimePicker,
  InputNumber,
  Upload,
  message,
  Spin,
  Row,
  Col,
  Card,
  Typography,
} from "antd";
import {
  UploadOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TagsOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotification } from "../../contexts/NotificationContext";
import eventService from "../../services/eventService";
import categoryService from "../../services/categoryService";
import aiService from "../../services/aiService";
import "./CreateEventScreen.css";

const { Option } = Select;
const { Title } = Typography;

const CreateEventScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [form] = Form.useForm();

  // State
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    date: null,
    time: null,
    location: "",
    maxAttendees: 100,
    price: 0,
    tags: [],
    image: null,
  });

  // AI-related state
  const [aiLoading, setAiLoading] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [generatedTags, setGeneratedTags] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await categoryService.getCategories();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      showError("Failed to load categories");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleSubmit = async (values) => {
    if (!user) {
      showError("You must be logged in to create an event");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const eventData = {
        ...formData,
        userId: user.id,
      };

      const result = await eventService.createEvent(eventData);
      if (result.success) {
        showSuccess("Event created successfully");
        navigate(`/events/${result.data.id}`);
      } else {
        showError("Failed to create event");
      }
    } catch (error) {
      showError("Failed to create event: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // AI functions
  const generateEventDescription = async () => {
    if (!formData.title || !formData.category) {
      showError("Please enter a title and select a category first");
      return;
    }

    setAiLoading(true);
    try {
      const response = await aiService.generateEventDescription(
        formData.title,
        formData.category,
        formData.location || ""
      );

      if (response && response.content) {
        setGeneratedDescription(response.content);
        setFormData({
          ...formData,
          description: response.content
        });
        form.setFieldsValue({ description: response.content });
        showSuccess("Description generated successfully");
      } else {
        showError("Failed to generate description");
      }
    } catch (error) {
      console.error("Error generating description:", error);
      showError("Failed to generate description: " + (error.message || "Unknown error"));
    } finally {
      setAiLoading(false);
    }
  };

  const generateTags = async () => {
    if (!formData.description) {
      showError("Please enter a description first");
      return;
    }

    setAiLoading(true);
    try {
      const tags = await aiService.generateTags(formData.description, 5);
      
      if (tags && tags.length > 0) {
        setGeneratedTags(tags);
        const updatedTags = [...(formData.tags || []), ...tags];
        setFormData({
          ...formData,
          tags: updatedTags
        });
        form.setFieldsValue({ tags: updatedTags });
        showSuccess("Tags generated successfully");
      } else {
        showError("Failed to generate tags");
      }
    } catch (error) {
      console.error("Error generating tags:", error);
      showError("Failed to generate tags: " + (error.message || "Unknown error"));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="create-event-container">
      <Card className="create-event-card">
        <Title level={2}>Create New Event</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={formData}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Event Title"
                name="title"
                rules={[{ required: true, message: "Please enter event title" }]}
              >
                <Input
                  placeholder="Enter event title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Category"
                name="category"
                rules={[{ required: true, message: "Please select a category" }]}
              >
                <Select
                  placeholder="Select category"
                  value={formData.category}
                  onChange={(value) => handleInputChange("category", value)}
                >
                  {categories.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please enter event description" }]}
          >
            <div>
              <Input.TextArea
                rows={6}
                placeholder="Describe your event..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
              />
              <Button
                type="dashed"
                onClick={generateEventDescription}
                loading={aiLoading}
                style={{ marginTop: 8 }}
                icon={<RobotOutlined />}
              >
                Generate Description with AI
              </Button>
            </div>
          </Form.Item>

          <Form.Item label="Tags" name="tags">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Select
                mode="tags"
                style={{ width: '100%' }}
                placeholder="Add tags..."
                value={formData.tags || []}
                onChange={(value) => handleInputChange("tags", value)}
              >
                {(formData.tags || []).map(tag => (
                  <Option key={tag} value={tag}>{tag}</Option>
                ))}
              </Select>
              <Button
                type="dashed"
                onClick={generateTags}
                loading={aiLoading}
                icon={<TagsOutlined />}
              >
                Generate Tags with AI
              </Button>
            </div>
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Date"
                name="date"
                rules={[{ required: true, message: "Please select date" }]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  value={formData.date}
                  onChange={(date) => handleInputChange("date", date)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Time"
                name="time"
                rules={[{ required: true, message: "Please select time" }]}
              >
                <TimePicker
                  style={{ width: "100%" }}
                  value={formData.time}
                  onChange={(time) => handleInputChange("time", time)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Location"
            name="location"
            rules={[{ required: true, message: "Please enter location" }]}
          >
            <Input
              placeholder="Enter event location"
              prefix={<EnvironmentOutlined />}
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Max Attendees"
                name="maxAttendees"
                rules={[{ required: true, message: "Please enter max attendees" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={1}
                  value={formData.maxAttendees}
                  onChange={(value) => handleInputChange("maxAttendees", value)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Price"
                name="price"
                rules={[{ required: true, message: "Please enter price" }]}
              >
                <InputNumber
                  style={{ width: "100%" }}
                  min={0}
                  step={0.01}
                  formatter={(value) => `$ ${value}`}
                  parser={(value) => value.replace(/\$\s?/g, "")}
                  value={formData.price}
                  onChange={(value) => handleInputChange("price", value)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Event Image" name="image">
            <Upload
              beforeUpload={() => false}
              onChange={({ file }) => handleInputChange("image", file)}
            >
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Create Event
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateEventScreen; 