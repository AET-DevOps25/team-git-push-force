package de.tum.aet.devops25.conceptsvc;

import java.io.ByteArrayOutputStream;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.itextpdf.kernel.colors.Color;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.List;
import com.itextpdf.layout.element.ListItem;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Text;
import com.itextpdf.layout.properties.AreaBreakType;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;

@Service
public class PdfService {
    
    // Colors for professional styling
    private static final Color PRIMARY_COLOR = new DeviceRgb(41, 128, 185);    // Professional blue
    private static final Color ACCENT_COLOR = new DeviceRgb(52, 73, 94);      // Dark gray-blue
    private static final Color TEXT_COLOR = new DeviceRgb(44, 62, 80);        // Dark gray
    private static final Color LIGHT_GRAY = new DeviceRgb(236, 240, 241);     // Light background
    
    public Resource generateConceptPdf(ConceptEntity concept) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);
            
            // Set document margins
            document.setMargins(50, 50, 50, 50);
            
            // Add content
            addEventOverviewPage(document, concept);
            
            if (hasAgendaOrSpeakers(concept)) {
                document.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
                addAgendaAndSpeakersPage(document, concept);
            }
            
            if (hasPricingOrNotes(concept)) {
                document.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
                addPricingAndNotesPage(document, concept);
            }
            
            document.close();
            
            byte[] pdfBytes = baos.toByteArray();
            return new ByteArrayResource(pdfBytes);
            
        } catch (Exception e) {
            // Fallback to simple text if PDF generation fails
            return generateFallbackPdf(concept);
        }
    }
    
    private void addEventOverviewPage(Document document, ConceptEntity concept) {
        // Title
        Paragraph title = new Paragraph(concept.getTitle())
                .setFontSize(24)
                .setBold()
                .setFontColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(10);
        document.add(title);
        
        // Subtitle
        Paragraph subtitle = new Paragraph("Event Concept Document")
                .setFontSize(14)
                .setFontColor(ACCENT_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(30);
        document.add(subtitle);
        
        // Status and dates info table
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .setWidth(UnitValue.createPercentValue(100));
        
        headerTable.addCell(createInfoCell("Status: " + concept.getStatus().toString()));
        headerTable.addCell(createInfoCell("Created: " + formatDate(concept.getCreatedAt())));
        
        document.add(headerTable);
        document.add(new Paragraph("\n"));
        
        // Event Details Section
        if (concept.getEventDetails() != null) {
            document.add(createSectionHeader("Event Details"));
            
            EventDetailsEntity details = concept.getEventDetails();
            Table detailsTable = new Table(UnitValue.createPercentArray(new float[]{1, 2}))
                    .setWidth(UnitValue.createPercentValue(100));
            
            if (details.getTheme() != null) {
                detailsTable.addCell(createLabelCell("Theme:"));
                detailsTable.addCell(createValueCell(details.getTheme()));
            }
            
            if (details.getFormat() != null) {
                detailsTable.addCell(createLabelCell("Format:"));
                detailsTable.addCell(createValueCell(details.getFormat().toString()));
            }
            
            if (details.getDuration() != null) {
                detailsTable.addCell(createLabelCell("Duration:"));
                detailsTable.addCell(createValueCell(details.getDuration()));
            }
            
            if (details.getStartDate() != null && details.getEndDate() != null) {
                detailsTable.addCell(createLabelCell("Dates:"));
                detailsTable.addCell(createValueCell(details.getStartDate() + " - " + details.getEndDate()));
            }
            
            if (details.getLocation() != null) {
                detailsTable.addCell(createLabelCell("Location:"));
                detailsTable.addCell(createValueCell(details.getLocation()));
            }
            
            if (details.getCapacity() != null) {
                detailsTable.addCell(createLabelCell("Expected Capacity:"));
                detailsTable.addCell(createValueCell(details.getCapacity() + " attendees"));
            }
            
            if (details.getTargetAudience() != null) {
                detailsTable.addCell(createLabelCell("Target Audience:"));
                detailsTable.addCell(createValueCell(details.getTargetAudience()));
            }
            
            document.add(detailsTable);
            document.add(new Paragraph("\n"));
            
            // Event Objectives
            if (details.getObjectives() != null && !details.getObjectives().isEmpty()) {
                document.add(createSectionHeader("Event Objectives"));
                com.itextpdf.layout.element.List objectivesList = new com.itextpdf.layout.element.List();
                for (String objective : details.getObjectives()) {
                    objectivesList.add(new ListItem(objective));
                }
                document.add(objectivesList);
                document.add(new Paragraph("\n"));
            }
        }
        
        // Description
        if (concept.getDescription() != null && !concept.getDescription().trim().isEmpty()) {
            document.add(createSectionHeader("Description"));
            Paragraph description = new Paragraph(concept.getDescription())
                    .setFontSize(11)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(15);
            document.add(description);
        }
        
        // Tags
        if (concept.getTags() != null && !concept.getTags().isEmpty()) {
            document.add(createSectionHeader("Tags"));
            String tagsText = String.join(", ", concept.getTags());
            Paragraph tags = new Paragraph(tagsText)
                    .setFontSize(10)
                    .setFontColor(ACCENT_COLOR)
                    .setItalic();
            document.add(tags);
        }
    }
    
    private void addAgendaAndSpeakersPage(Document document, ConceptEntity concept) {
        // Agenda Section
        if (concept.getAgenda() != null && !concept.getAgenda().isEmpty()) {
            document.add(createSectionHeader("Event Agenda"));
            
            Table agendaTable = new Table(UnitValue.createPercentArray(new float[]{1, 3, 1.5f, 1.5f}))
                    .setWidth(UnitValue.createPercentValue(100));
            
            // Header row
            agendaTable.addHeaderCell(createHeaderCell("Time"));
            agendaTable.addHeaderCell(createHeaderCell("Session Title"));
            agendaTable.addHeaderCell(createHeaderCell("Type"));
            agendaTable.addHeaderCell(createHeaderCell("Speaker"));
            
            // Data rows
            for (AgendaItemEntity item : concept.getAgenda()) {
                agendaTable.addCell(createDataCell(item.getTime() != null ? item.getTime() : "TBD"));
                
                // Session title with description
                String sessionInfo = item.getTitle();
                if (item.getDescription() != null && !item.getDescription().trim().isEmpty()) {
                    sessionInfo += "\n" + item.getDescription();
                }
                agendaTable.addCell(createDataCell(sessionInfo));
                
                agendaTable.addCell(createDataCell(item.getType() != null ? item.getType().toString() : ""));
                agendaTable.addCell(createDataCell(item.getSpeaker() != null ? item.getSpeaker() : "TBD"));
            }
            
            document.add(agendaTable);
            document.add(new Paragraph("\n"));
        }
        
        // Speakers Section
        if (concept.getSpeakers() != null && !concept.getSpeakers().isEmpty()) {
            document.add(createSectionHeader("Speaker Information"));
            
            for (SpeakerEntity speaker : concept.getSpeakers()) {
                // Speaker name and expertise
                Paragraph speakerName = new Paragraph()
                        .add(new Text(speaker.getName()).setBold().setFontSize(12))
                        .setMarginBottom(5);
                
                if (speaker.getExpertise() != null) {
                    speakerName.add(new Text(" - " + speaker.getExpertise()).setFontColor(ACCENT_COLOR));
                }
                document.add(speakerName);
                
                // Bio
                if (speaker.getBio() != null && !speaker.getBio().trim().isEmpty()) {
                    Paragraph bio = new Paragraph(speaker.getBio())
                            .setFontSize(10)
                            .setMarginLeft(10)
                            .setMarginBottom(5);
                    document.add(bio);
                }
                
                // Suggested topic
                if (speaker.getSuggestedTopic() != null) {
                    Paragraph topic = new Paragraph("Suggested Topic: " + speaker.getSuggestedTopic())
                            .setFontSize(10)
                            .setFontColor(ACCENT_COLOR)
                            .setMarginLeft(10)
                            .setMarginBottom(15);
                    document.add(topic);
                }
            }
        }
    }
    
    private void addPricingAndNotesPage(Document document, ConceptEntity concept) {
        // Pricing Section
        if (concept.getPricing() != null && hasPricingData(concept.getPricing())) {
            document.add(createSectionHeader("Ticket Pricing"));
            
            PricingEntity pricing = concept.getPricing();
            String currency = pricing.getCurrency() != null ? pricing.getCurrency() : "EUR";
            
            Table pricingTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                    .setWidth(UnitValue.createPercentValue(100));
            
            if (pricing.getEarlyBird() != null) {
                pricingTable.addCell(createLabelCell("Early Bird:"));
                pricingTable.addCell(createValueCell(currency + " " + pricing.getEarlyBird()));
            }
            
            if (pricing.getRegular() != null) {
                pricingTable.addCell(createLabelCell("Regular:"));
                pricingTable.addCell(createValueCell(currency + " " + pricing.getRegular()));
            }
            
            if (pricing.getVip() != null) {
                pricingTable.addCell(createLabelCell("VIP:"));
                pricingTable.addCell(createValueCell(currency + " " + pricing.getVip()));
            }
            
            if (pricing.getStudent() != null) {
                pricingTable.addCell(createLabelCell("Student:"));
                pricingTable.addCell(createValueCell(currency + " " + pricing.getStudent()));
            }
            
            if (pricing.getGroup() != null) {
                pricingTable.addCell(createLabelCell("Group:"));
                pricingTable.addCell(createValueCell(currency + " " + pricing.getGroup()));
            }
            
            document.add(pricingTable);
            document.add(new Paragraph("\n"));
        }
        
        // Notes Section
        if (concept.getNotes() != null && !concept.getNotes().trim().isEmpty()) {
            document.add(createSectionHeader("Additional Notes"));
            Paragraph notes = new Paragraph(concept.getNotes())
                    .setFontSize(11)
                    .setTextAlignment(TextAlignment.JUSTIFIED)
                    .setMarginBottom(15);
            document.add(notes);
        }
        
        // Footer with generation info
        document.add(new Paragraph("\n\n"));
        Paragraph footer = new Paragraph()
                .add(new Text("Document generated: " + formatDate(OffsetDateTime.now())).setFontSize(8))
                .add(new Text("  |  Version: " + (concept.getVersion() != null ? concept.getVersion() : "1")).setFontSize(8))
                .setFontColor(ACCENT_COLOR)
                .setTextAlignment(TextAlignment.CENTER);
        document.add(footer);
    }
    
    // Helper methods for styling
    private Paragraph createSectionHeader(String title) {
        return new Paragraph(title)
                .setFontSize(16)
                .setBold()
                .setFontColor(PRIMARY_COLOR)
                .setMarginTop(15)
                .setMarginBottom(10);
    }
    
    private Cell createHeaderCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontColor(DeviceRgb.WHITE))
                .setBackgroundColor(PRIMARY_COLOR)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(8);
    }
    
    private Cell createDataCell(String text) {
        return new Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(10))
                .setPadding(5)
                .setBackgroundColor(LIGHT_GRAY);
    }
    
    private Cell createLabelCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(11))
                .setPadding(5)
                .setBorderRight(null);
    }
    
    private Cell createValueCell(String text) {
        return new Cell()
                .add(new Paragraph(text != null ? text : "").setFontSize(11))
                .setPadding(5)
                .setBorderLeft(null);
    }
    
    private Cell createInfoCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setFontSize(10).setFontColor(ACCENT_COLOR))
                .setBorder(null)
                .setPadding(5);
    }
    
    // Utility methods
    private boolean hasAgendaOrSpeakers(ConceptEntity concept) {
        return (concept.getAgenda() != null && !concept.getAgenda().isEmpty()) ||
               (concept.getSpeakers() != null && !concept.getSpeakers().isEmpty());
    }
    
    private boolean hasPricingOrNotes(ConceptEntity concept) {
        return hasPricingData(concept.getPricing()) ||
               (concept.getNotes() != null && !concept.getNotes().trim().isEmpty());
    }
    
    private boolean hasPricingData(PricingEntity pricing) {
        if (pricing == null) return false;
        return pricing.getEarlyBird() != null || pricing.getRegular() != null ||
               pricing.getVip() != null || pricing.getStudent() != null || pricing.getGroup() != null;
    }
    
    private String formatDate(OffsetDateTime dateTime) {
        if (dateTime == null) return "N/A";
        return dateTime.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"));
    }
    
    private Resource generateFallbackPdf(ConceptEntity concept) {
        // Fallback to simple text if PDF generation fails
        StringBuilder content = new StringBuilder();
        content.append("=== CONCEPT PDF REPORT ===\n\n");
        content.append("Title: ").append(concept.getTitle()).append("\n");
        content.append("Description: ").append(concept.getDescription() != null ? concept.getDescription() : "N/A").append("\n");
        content.append("Status: ").append(concept.getStatus()).append("\n");
        content.append("Created: ").append(concept.getCreatedAt()).append("\n");
        content.append("Updated: ").append(concept.getUpdatedAt()).append("\n");
        content.append("\nGenerated at: ").append(OffsetDateTime.now()).append("\n");
        content.append("=== END OF REPORT ===");
        
        byte[] pdfBytes = content.toString().getBytes();
        return new ByteArrayResource(pdfBytes);
    }
} 