'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  Textarea,
  Pill,
  PillList,
  Drawer,
  PillOption,
} from '../index';
import styles from './InteractionExamples.module.css';

export const InteractionExamples: React.FC = () => {
  // Form state
  const [inputValue, setInputValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [errorInput, setErrorInput] = useState('');

  // Pill state
  const [singleSelected, setSingleSelected] = useState<string[]>(['option1']);
  const [multipleSelected, setMultipleSelected] = useState<string[]>(['option1', 'option3']);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const pillOptions: PillOption[] = [
    { id: 'option1', label: 'Option 1' },
    { id: 'option2', label: 'Option 2' },
    { id: 'option3', label: 'Option 3' },
    { id: 'option4', label: 'Option 4' },
  ];

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (errorInput && value.length > 3) {
      setErrorInput('');
    }
  };

  const validateInput = () => {
    if (inputValue.length < 3) {
      setErrorInput('Input must be at least 3 characters long');
    } else {
      setErrorInput('');
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Interaction Components</h1>

      {/* Buttons Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>

        {/* Button Variants */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Variants</h3>
          <div className={styles.buttonGroup}>
            <Button variant="primary" onClick={() => console.log('Primary clicked')}>
              Primary Button
            </Button>
            <Button variant="secondary" onClick={() => console.log('Secondary clicked')}>
              Secondary Button
            </Button>
            <Button variant="ghost" onClick={() => console.log('Ghost clicked')}>
              Ghost Button
            </Button>
          </div>
        </div>

        {/* Button Sizes */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Sizes</h3>
          <div className={styles.buttonRow}>
            <Button variant="primary" size="xs" onClick={() => console.log('XS clicked')}>
              XS
            </Button>
            <Button variant="primary" size="sm" onClick={() => console.log('SM clicked')}>
              SM
            </Button>
            <Button variant="primary" size="md" onClick={() => console.log('MD clicked')}>
              MD
            </Button>
            <Button variant="primary" size="lg" onClick={() => console.log('LG clicked')}>
              LG
            </Button>
            <Button variant="primary" size="xl" onClick={() => console.log('XL clicked')}>
              XL
            </Button>
          </div>
        </div>

        {/* Disabled Button */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Disabled State</h3>
          <Button variant="primary" disabled onClick={() => console.log('Disabled clicked')}>
            Disabled Button
          </Button>
        </div>
      </section>

      {/* Form Inputs Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Form Inputs</h2>

        {/* Input Field */}
        <div className={styles.inputGroup}>
          <Input
            label="Text Input"
            placeholder="Enter some text..."
            value={inputValue}
            onChange={handleInputChange}
            error={errorInput}
            required
          />
          <Button variant="secondary" size="sm" onClick={validateInput}>
            Validate Input
          </Button>
        </div>

        {/* Email Input */}
        <div className={styles.inputGroup}>
          <Input
            type="email"
            label="Email Address"
            placeholder="Enter your email..."
            value={emailValue}
            onChange={setEmailValue}
          />
        </div>

        {/* Textarea */}
        <div className={styles.inputGroup}>
          <Textarea
            label="Description"
            placeholder="Enter a longer description..."
            value={textareaValue}
            onChange={setTextareaValue}
            autoResize
            rows={3}
          />
        </div>

        {/* Different Input Sizes */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Input Sizes</h3>
          <div className={styles.sizeGroup}>
            <Input size="xs" placeholder="Extra small input" />
            <Input size="sm" placeholder="Small input" />
            <Input size="md" placeholder="Medium input (default)" />
            <Input size="lg" placeholder="Large input" />
            <Input size="xl" placeholder="Extra large input" />
          </div>
        </div>
      </section>

      {/* Pills Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Pills</h2>

        {/* Individual Pills */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Individual Pills</h3>
          <div className={styles.pillGroup}>
            <Pill label="Active Pill" selected />
            <Pill label="Inactive Pill" selected={false} />
            <Pill label="Disabled Pill" disabled />
          </div>
        </div>

        {/* Pill List - Single Selection */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Single Selection Pill List</h3>
          <PillList
            options={pillOptions}
            selected={singleSelected}
            onChange={setSingleSelected}
            variant="single"
          />
        </div>

        {/* Pill List - Multiple Selection */}
        <div className={styles.subsection}>
          <h3 className={styles.subsectionTitle}>Multiple Selection Pill List</h3>
          <PillList
            options={pillOptions}
            selected={multipleSelected}
            onChange={setMultipleSelected}
            variant="multiple"
          />
        </div>
      </section>

      {/* Drawer Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Drawer</h2>

        <div className={styles.subsection}>
          <div className={styles.buttonGroup}>
            <Button variant="primary" onClick={() => setIsDrawerOpen(true)}>
              Open Drawer (Right)
            </Button>
          </div>
        </div>
      </section>

      {/* Drawer Component */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        position="right"
        shouldOpenWithBackdrop
      >
        <div className={styles.drawerContent}>
          <h3 className={styles.drawerTitle}>Drawer Content</h3>
          <p className={styles.drawerText}>
            This is the content inside the drawer. You can put any components here.
          </p>

          <div className={styles.drawerForm}>
            <Input label="Name" placeholder="Enter your name" />
            <Textarea label="Message" placeholder="Enter your message" rows={4} />
          </div>

          <div className={styles.drawerActions}>
            <Button variant="primary" onClick={() => setIsDrawerOpen(false)}>
              Save
            </Button>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};