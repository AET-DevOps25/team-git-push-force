package de.tum.aet.devops25.conceptsvc;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "concepts", indexes = {
    @Index(name = "idx_concept_user_id", columnList = "userId"),
    @Index(name = "idx_concept_status", columnList = "status"),
    @Index(name = "idx_concept_updated_at", columnList = "updatedAt"),
    @Index(name = "idx_concept_user_status", columnList = "userId, status"),
    @Index(name = "idx_concept_user_updated", columnList = "userId, updatedAt DESC")
})
@EntityListeners(AuditingEntityListener.class)
public class ConceptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String title;

    @Size(max = 5000)
    @Column(columnDefinition = "TEXT")
    private String description;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConceptStatus status = ConceptStatus.DRAFT;

    @NotNull
    @Column(nullable = false)
    private UUID userId;

    @Embedded
    private EventDetailsEntity eventDetails;

    @Embedded
    private PricingEntity pricing;

    @OneToMany(mappedBy = "concept", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<AgendaItemEntity> agenda = new ArrayList<>();

    @OneToMany(mappedBy = "concept", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<SpeakerEntity> speakers = new ArrayList<>();

    @Size(max = 5000)
    @Column(columnDefinition = "TEXT")
    private String notes;

    @ElementCollection
    @CollectionTable(name = "concept_tags", joinColumns = @JoinColumn(name = "concept_id"))
    @Column(name = "tag")
    private List<String> tags = new ArrayList<>();

    @Version
    private Integer version;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private OffsetDateTime updatedAt;

    @NotNull
    @Column(nullable = false)
    private UUID lastModifiedBy;

    // Helper methods for relationship management
    public void addAgendaItem(AgendaItemEntity item) {
        agenda.add(item);
        item.setConcept(this);
    }

    public void removeAgendaItem(AgendaItemEntity item) {
        agenda.remove(item);
        item.setConcept(null);
    }

    public void addSpeaker(SpeakerEntity speaker) {
        speakers.add(speaker);
        speaker.setConcept(this);
    }

    public void removeSpeaker(SpeakerEntity speaker) {
        speakers.remove(speaker);
        speaker.setConcept(null);
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ConceptStatus getStatus() {
        return status;
    }

    public void setStatus(ConceptStatus status) {
        this.status = status;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public EventDetailsEntity getEventDetails() {
        return eventDetails;
    }

    public void setEventDetails(EventDetailsEntity eventDetails) {
        this.eventDetails = eventDetails;
    }

    public PricingEntity getPricing() {
        return pricing;
    }

    public void setPricing(PricingEntity pricing) {
        this.pricing = pricing;
    }

    public List<AgendaItemEntity> getAgenda() {
        return agenda;
    }

    public void setAgenda(List<AgendaItemEntity> agenda) {
        this.agenda = agenda;
    }

    public List<SpeakerEntity> getSpeakers() {
        return speakers;
    }

    public void setSpeakers(List<SpeakerEntity> speakers) {
        this.speakers = speakers;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public Integer getVersion() {
        return version;
    }

    public void setVersion(Integer version) {
        this.version = version;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(OffsetDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public UUID getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(UUID lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }
} 