package domain

import (
	"fmt"

	"github.com/Notifuse/notifuse/pkg/crypto"
)

// BrevoSettings contains configuration for Brevo email provider
type BrevoSettings struct {
	EncryptedAPIKey string `json:"encrypted_api_key,omitempty"`

	// decoded API key, not stored in the database
	APIKey string `json:"api_key,omitempty"`
}

func (s *BrevoSettings) DecryptAPIKey(passphrase string) error {
	apiKey, err := crypto.DecryptFromHexString(s.EncryptedAPIKey, passphrase)
	if err != nil {
		return fmt.Errorf("failed to decrypt Brevo API key: %w", err)
	}
	s.APIKey = apiKey
	return nil
}

func (s *BrevoSettings) EncryptAPIKey(passphrase string) error {
	encryptedAPIKey, err := crypto.EncryptString(s.APIKey, passphrase)
	if err != nil {
		return fmt.Errorf("failed to encrypt Brevo API key: %w", err)
	}
	s.EncryptedAPIKey = encryptedAPIKey
	return nil
}

func (s *BrevoSettings) Validate(passphrase string) error {
	if s.APIKey != "" {
		if err := s.EncryptAPIKey(passphrase); err != nil {
			return fmt.Errorf("failed to encrypt Brevo API key: %w", err)
		}
	}

	return nil
}

// BrevoWebhookEvent represents a single event from Brevo webhook payload
type BrevoWebhookEvent struct {
	Event     string `json:"event"`      // delivered, soft_bounce, hard_bounce, complaint, blocked, invalid_email, deferred, click, opened, unique_opened, unsubscribed
	Email     string `json:"email"`      // Recipient email
	MessageID string `json:"message-id"` // Brevo message ID
	Timestamp int64  `json:"ts_epoch"`   // Unix timestamp in milliseconds
	Tag       string `json:"tag"`        // Custom tag

	// Bounce-specific fields
	Reason string `json:"reason,omitempty"`

	// Click/Open fields
	IP  string `json:"ip,omitempty"`
	URL string `json:"link,omitempty"`
}
